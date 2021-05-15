import { sourceNode } from './sourceNode';

export default {

    /**
     * @return {null}
     */
    ImportStatement: ( { node, figure } ) => {
        const importNode = sourceNode( node.loc,
            `import ${node.identifier.name} from ${node.path.value};`
        );

        figure.root().addImport( importNode );

        figure.addToScope( node.identifier.name );

        return null;
    }
};
