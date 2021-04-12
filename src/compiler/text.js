import { sourceNode } from './sourceNode';
import { esc } from '../utils';

export default {
    Text: ( { node, figure } ) => {
        node.reference = 'text' + figure.uniqid();
        figure.domRef = true;

        figure.declare(
            sourceNode( node.loc, [

                // Trim new lines and white spaces to a single whitespace.
                `const ${node.reference} = dom.text( ${esc( node.text.replace( /^\s+|\s+$/g, ' ' ) )} );`
            ] )
        );
        return node.reference;
    }
};
