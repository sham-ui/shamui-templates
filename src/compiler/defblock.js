import { sourceNode } from './sourceNode';
import { getStringLiteralValue } from '../utils';

export default {
    DefBlockStatement: ( { node, figure } ) => {
        const name = getStringLiteralValue( node.name );
        const placeholder = `${name}Block`;
        node.reference = placeholder;
        figure.domRef = true;
        figure.declare(
            sourceNode( `const ${placeholder} = dom.comment( '${figure.uniqid( 'comment' )}' );` )
        );

        figure.addRenderActions(
            sourceNode( [
                `        if ( this.blocks[ ref( '${name}' ) ] ) {\n`,
                `            this.blocks[ ref( '${name}' ) ]( ${placeholder}, this );\n`,
                '        }'
            ] )
        );
        return node.reference;
    }
};
