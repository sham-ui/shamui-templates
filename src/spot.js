import { unique } from './utils';
import { sourceNode } from './compiler/sourceNode';

export class Spot {
    constructor( variables ) {
        this.variables = unique( variables ).sort();
        this.reference = this.variables.join( '_' );
        this.declaredVariables = {};
        this.operators = [];
        this.length = this.variables.length;
        this.weight = this.length;
        this.cache = false;
        this.onlyFromLoop = false;
    }

    generateOperation() {
        let sn = sourceNode(
            `( ${this.variables.join( ', ' )} ) => `
        );

        const isMultilineOperation = (
            this.declaredVariables > 0 ||
            this.operators.length > 1
        );
        if ( isMultilineOperation ) {
            sn.add( '{\n' );
        }

        Object.keys( this.declaredVariables ).forEach( name => {
            sn.add( `                let ${name};\n` );
        } );

        if ( this.operators.length > 0 ) {
            sn.add( sourceNode( this.operators ).join( ';\n' ) );
            if ( isMultilineOperation ) {
                sn.add( ';' );
            }
            sn.add( '\n' );
        }

        if ( isMultilineOperation ) {
            sn.add( '                }' );
        }


        return sn;
    }

    add( code ) {
        this.operators.push( code );
        return this;
    }

    declareVariable( name ) {
        this.declaredVariables[ name ] = true;
        return this;
    }
}
