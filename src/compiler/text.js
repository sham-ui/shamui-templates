import { sourceNode } from './sourceNode';
import { esc } from '../utils';

export default {
    Text: ( { node, figure } ) => {
        figure.domRef = true;

        // Trim new lines and white spaces to a single whitespace.
        return sourceNode( node.loc,
            [ `dom.text( ${esc( node.text.replace( /^\s+|\s+$/g, ' ' ) )} )` ] );
    }
};
