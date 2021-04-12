import { sourceNode } from './sourceNode';
import { collectVariables } from './variable';

export default {
    LetStatement: ( { node, compile, figure } ) => {
        const variables = collectVariables( figure.getScope(), node.expression );

        const spot = figure.spot( variables ).add(
            sourceNode( node.loc,
                [
                    '                    ',
                    'this.__data__.', node.identifier.name, ' = ', compile( node.expression )
                ]
            )
        );

        // Increase variable weight for correct order
        figure.spot( node.identifier.name ).weight = 1 + spot.weight;

        return null;
    }
};
