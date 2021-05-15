import { sourceNode } from './compiler/sourceNode';
import { size } from './utils';
import { Spot } from './spot';

export class Figure {
    constructor( name, parent = null ) {
        this.name = name;
        this.parent = parent;
        this.uniqCounters = {};
        this.children = [];
        this.scriptCode = [];
        this.functions = {};
        this.imports = [];
        this.declarations = [];
        this.constructions = [];
        this.directives = [];
        this.renderActions = [];
        this.subFigures = [];
        this.spots = {};
        this.scope = [];
        this.onUpdate = [];
        this.onRemove = [];
        this.blocks = {};
        this.domRef = false;
        this.runtimeImports = new Set();
        if ( parent === null ) {
            this.runtimeImports.add( 'Component' );
        }
    }

    generate() {
        let sn = sourceNode( '' );

        if ( null === this.parent ) {
            sn.add( sourceNode( 'import { ref } from \'sham-ui-macro/babel.macro\';\n' ) );
        }

        if ( this.runtimeImports.size > 0 ) {
            const runtimeImports = Array.from( this.runtimeImports.values() ).join( ', ' );
            sn.add( sourceNode( `import { ${runtimeImports} } from 'sham-ui';\n` ) );
        }

        if ( this.imports.length > 0 ) {
            sn.add( sourceNode( this.imports ).join( '\n' ) );
            sn.add( '\n' );
        }

        if ( size( this.functions ) > 0 ) {
            sn.add( '\n' );
            sn.add( this.generateFunctions() );
        }

        sn.add( '\n' );

        if ( null === this.parent ) {
            sn.add( `function ${this.name}` );
        } else {
            sn.add( `const ${this.name} = Component( function` );
        }

        if ( this.onRemove.length > 0 ) {
            sn.add( '( options, update, didMount, onRemove ) {\n' );
        } else {
            sn.add( '() {\n' );
        }

        sn.add( '\n' );

        if ( null === this.parent ) {
            sn.add( [
                '    this.isRoot = true;\n',
                '\n'
            ] );
        }

        if ( this.domRef ) {
            sn.add( [
                '    const dom = this.dom;\n',
                '\n'
            ] );
        }

        if ( this.declarations.length > 0 ) {
            sn.add( [
                '    // Create elements\n',
                '    ', sourceNode( this.declarations ).join( '\n    ' ),
                '\n\n'
            ] );
        }

        if ( this.constructions.length > 0 ) {
            sn.add( [
                '\n',
                '    if ( dom.build() ) {\n\n',
                '        // Construct dom\n',
                '        ', sourceNode( null, this.constructions ).join( '\n        ' ),
                '\n    }\n\n'
            ] );
        }

        if ( this.directives.length > 0 ) {
            sn.add( [
                '\n',
                '    // Directives\n',
                sourceNode( null, this.directives ).join( '\n    ' ),
                '\n\n'
            ] );
        }

        if ( size( this.blocks ) > 0 ) {
            sn.add( [
                '\n',
                '    // Blocks\n',
                this.generateBlocks(),
                '\n\n'
            ] );
        }

        if ( size( this.spots ) > 0 ) {
            sn.add( [
                '\n',
                '    // Update spot functions\n',
                '    this.spots = [\n',
                '    ', this.generateSpots(), '\n',
                '    ];\n',
                '\n'
            ] );
        }

        if ( this.renderActions.length > 0 ) {
            sn.add( [
                '\n',
                '    // Extra render actions\n',
                '    this.onRender = () => {\n',
                sourceNode( this.renderActions ).join( '\n' ), '\n',
                '    };\n',
                '\n'
            ] );
        }

        if ( this.onUpdate.length > 0 ) {
            sn.add( [
                '\n',
                '    // On update actions\n',
                '    this.onUpdate = ( __data__ ) => {\n',
                sourceNode( this.onUpdate ).join( '\n' ), '\n',
                '     };\n',
                '\n'
            ] );
        }

        if ( this.onRemove.length > 0 ) {
            sn.add( [
                '\n',
                '    // On remove actions\n',
                '    onRemove( () => {\n',
                sourceNode( this.onRemove ).join( '\n' ), '\n',
                '    } );\n',
                '\n'
            ] );
        }

        sn.add( [
            '\n',
            '    // Set root nodes\n',
            '    this.nodes = [ ', sourceNode( this.children ).join( ', ' ), ' ];\n'
        ] );


        if ( null === this.parent ) {
            sn.add( '};\n' );
        } else {
            sn.add( '} );\n' );
        }

        for ( let subfigure of this.subFigures ) {
            sn.add( subfigure.generate() );
        }

        if ( this.scriptCode.length > 0 ) {
            sn.add( this.scriptCode );
        }

        return sn;
    }

    generateFunctions() {
        const defn = [];
        Object.keys( this.functions ).forEach( ( key ) => {
            defn.push( sourceNode( `const ${key} = ${this.functions[ key ]};` ) );
        } );
        return sourceNode( defn ).join( '\n' ).add( '\n' );
    }

    generateSpots() {
        const parts = [];

        let spots = Object.keys( this.spots ).map( key => this.spots[ key ] )
            .sort( ( a, b ) => a.weight - b.weight );
        for ( let spot of spots ) {
            let generatedSpot;

            if ( spot.onlyFromLoop || spot.cache || spot.length > 1 ) {
                if ( spot.onlyFromLoop && !spot.cache && 0 === spot.operators.length ) {
                    continue;
                }

                generatedSpot = sourceNode( [
                    '    [\n'
                ] );

                if ( spot.length > 1 ) {
                    const variables = spot.variables.map( x => `ref( '${x}' )` ).join( ', ' );
                    generatedSpot.add( [
                        '            [ ', variables, ' ]'
                    ] );
                } else {
                    generatedSpot.add(
                        `            ref( '${spot.variables[ 0 ]}' )`
                    );
                }

                if ( spot.operators.length > 0 ) {
                    generatedSpot.add( [
                        ',\n',
                        `            ${spot.generateOperation()}`
                    ] );
                }

                let optionMask = 0;
                let options = [];
                if ( spot.cache ) {
                    optionMask = optionMask | 1; // SPOT_CACHE = 2
                    options.push( 'CACHE' );
                }
                if ( spot.onlyFromLoop ) {
                    optionMask = optionMask | 2; // SPOT_LOOP = 1
                    options.push( 'LOOP' );
                }


                if ( optionMask > 0 ) {
                    generatedSpot.add( [
                        ',\n',
                        `            ${optionMask}${` // ${options.join( ', ' )}`}`
                    ] );
                }
                generatedSpot.add( '\n        ]' );
            } else if ( 0 === spot.operators.length ) {
                continue;
            } else {
                const variable = 0 === spot.length ?
                    '[]' :
                    `ref( '${spot.variables[ 0 ]}' )`
                ;
                generatedSpot = sourceNode( [
                    '    [\n',
                    `            ${variable},\n`,
                    `            ${spot.generateOperation()}`,
                    '\n        ]'
                ] );
            }

            parts.push(
                generatedSpot
            );
        }
        return sourceNode( null, parts ).join( ',\n    ' );
    }

    generateBlocks() {
        const parts = [];

        Object.keys( this.blocks )
            .map( componentRef => {
                const block = this.blocks[ componentRef ];
                if ( 0 === block.length ) {
                    parts.push( sourceNode(
                        `    const ${componentRef} = {};`
                    ) );
                } else {
                    parts.push( sourceNode( [
                        `    const ${componentRef} = {\n`,
                        block.join( ',\n' ), '\n',
                        '    };'
                    ] ) );
                }
            } );

        return sourceNode( null, parts ).join( '\n' );
    }

    uniqid( name = 'default' ) {
        if ( !this.uniqCounters[ name ] ) {
            this.uniqCounters[ name ] = 0;
        }
        return this.uniqCounters[ name ]++;
    }

    spot( variables ) {
        let s = new Spot( [].concat( variables ) );

        if ( !this.spots.hasOwnProperty( s.reference ) ) {
            this.spots[ s.reference ] = s;

            if ( s.variables.length > 1 ) {
                let weight = 0;
                for ( let variable of s.variables ) {
                    const spot = this.spot( variable );
                    spot.cache = true;
                    weight += spot.weight;
                }
                s.weight = weight;
            }
        }

        return this.spots[ s.reference ];
    }

    root() {
        if ( this.parent ) {
            return this.parent.root();
        } else {
            return this;
        }
    }

    getPathToDocument() {
        return this.parent ? 'this.owner' : 'this';
    }

    getScope() {
        if ( this.parent ) {
            return [].concat( this.scope ).concat( this.parent.getScope() );
        } else {
            return this.scope;
        }
    }

    addToScope( variable ) {
        this.scope.push( variable );
    }

    isInScope( variable ) {
        return this.getScope().indexOf( variable ) !== -1;
    }

    declare( node ) {
        this.declarations.push( node );
    }

    construct( node ) {
        this.constructions.push( node );
    }

    addFunction( name, source ) {
        if ( !this.functions.hasOwnProperty( name ) ) {
            this.functions[ name ] = source;
        }
    }

    addFigure( figure ) {
        this.subFigures.push( figure );
    }

    addRenderActions( action ) {
        this.renderActions.push( action );
    }

    addImport( source ) {
        this.imports.push( source );
    }

    addRuntimeImport( name ) {
        this.root().runtimeImports.add( name );
    }

    addOnUpdate( node ) {
        this.onUpdate.push( node );
    }

    addOnRemove( node ) {
        this.onRemove.push( node );
    }

    addDirective( node ) {
        this.directives.push( node );
    }

    addBlock( componentName, block ) {
        if ( !this.blocks[ componentName ] ) {
            this.blocks[ componentName ] = [];
        }
        if ( block ) {
            this.blocks[ componentName ].push( block );
        }
    }

    addScriptCode( node ) {
        node.body.forEach(
            subNode => this.scriptCode.push(
                sourceNode( subNode.loc, subNode.text )
            )
        );
    }
}
