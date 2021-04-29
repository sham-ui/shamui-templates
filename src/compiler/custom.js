import { sourceNode } from './sourceNode';
import { collectVariables } from './variable';
import { isSingleChild, unique, notNull, getTemplateName } from '../utils';
import { compileToExpression } from './attribute';

export default {
    Element: ( { parent, node, figure, compile } ) => {
        node.reference = null;

        let templateName = getTemplateName( node.name );
        let childName = 'child' + figure.uniqid( 'child_name' );
        let placeholder;

        if ( isSingleChild( parent, node ) ) {
            placeholder = parent.reference;
        } else {
            placeholder = 'custom' + figure.uniqid( 'placeholder' );
            node.reference = placeholder;
            figure.domRef = true;
            figure.declare( sourceNode( `const ${placeholder} = dom.comment( '${figure.uniqid( 'comment' )}' );` ) );
        }

        figure.declare( sourceNode( `const ${childName} = {};` ) );

        const blockRef = `${childName}_blocks`;
        figure.addBlock( blockRef );

        let data = [];
        let variables = [];

        // Collect info about variables and attributes.
        for ( let attr of node.attributes ) {
            if ( attr.type === 'SpreadAttribute' ) {
                let [ expr ] = compileToExpression( figure, attr, compile );
                const variables = collectVariables( figure.getScope(), expr );
                let spreadSN = sourceNode( node.loc,
                    `            insert( this, ${placeholder}, ${childName}, ${templateName}, ${compile( expr )}, ${figure.getPathToDocument()} )`
                );
                if ( variables.length > 0 ) {
                    figure.spot( variables ).add( spreadSN );
                } else {
                    figure.addOnUpdate( spreadSN );
                }
            } else {

                let [ expr ] = compileToExpression( figure, attr, compile ); // TODO: Add support for default value in custom tag attributes attr={{ value || 'default' }}.
                variables = variables.concat( collectVariables( figure.getScope(), expr ) );

                let property = sourceNode( node.loc, [ `[ ref( '${attr.name}' ) ]: ${compile( expr )}` ] );
                data.push( property );

            }
        }

        variables = unique( variables );
        data = `{ ${data.join( ', ' )} }`;


        figure.addRuntimeImport( 'insert' );
        const mountCode = `insert( this, ${placeholder}, ${childName}, ${templateName}, ${data}, ${figure.getPathToDocument()}, ${blockRef} )`;

        // Add spot for custom attribute or insert on render if no variables in attributes.
        if ( variables.length > 0 ) {
            const spot = figure.spot( variables );
            spot.add(
                sourceNode( node.loc, `            ${mountCode}` )
            );
        } else {
            figure.addRenderActions(
                sourceNode( node.loc, `        ${mountCode}` )
            );
        }


        if ( node.body.length > 0 ) {
            node.addBlock = ( sn ) => {
                figure.addBlock( blockRef, sn );
            };
            figure.children = node.body
                .map( ( child ) => compile( child, figure ) )
                .filter( notNull );
            delete node.addBlock;
        }

        return node.reference;
    }
};
