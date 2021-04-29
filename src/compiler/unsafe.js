import { sourceNode } from './sourceNode';
import { collectVariables } from './variable';
import { isSingleChild } from '../utils';

export default {
    UnsafeStatement: ( { parent, node, figure, compile } ) => {
        node.reference = null;

        let unsafeNumber = figure.uniqid( 'unsafe' );
        let unsafeNodes = 'unsafeNodes' + unsafeNumber;
        let placeholder;

        if ( isSingleChild( parent, node ) ) {
            placeholder = parent.reference;
        } else {
            node.reference = placeholder = 'unsafe' + unsafeNumber;
            figure.domRef = true;
            figure.declare( sourceNode( `const ${placeholder} = dom.comment( '${figure.uniqid( 'comment' )}' );` ) );
        }


        figure.declare( sourceNode( `var ${unsafeNodes} = [];` ) );

        let variables = collectVariables( figure.getScope(), node.html );

        if ( variables.length === 0 ) {
            figure.addRenderActions(
                sourceNode( node.loc, [
                    `  dom.unsafe(${placeholder}, ${unsafeNodes}, `, compile( node.html ), ');'
                ] )
            );
        } else {
            figure.spot( variables ).add(
                sourceNode( node.loc, [
                    `  dom.unsafe(${placeholder}, ${unsafeNodes}, `, compile( node.html ), ')'
                ] )
            );
        }

        return node.reference;
    }
};
