import { sourceNode } from './sourceNode';
import { Figure } from '../figure';
import { notNull, getStringLiteralValue, getTemplateName } from '../utils';

export default {
    UseBlockStatement: ( { node, parent, figure, compile } ) => {
        node.reference = null;

        if ( !parent || 'Element' !== parent.type ) {
            throw new Error( 'Usage {% block %} only with custom Component' );
        }

        const parentName = getTemplateName( parent.name );
        const blockName = getStringLiteralValue( node.name );
        const templateName = `${figure.name}_${parentName}_block_${blockName}_${figure.uniqid( 'template_name' )}`;
        const childName = 'child' + figure.uniqid( 'child_name' );
        figure.declare( `const ${childName} = {};` );

        let compileBody = ( loc, body, templateName, childName ) => {
            let subfigure = new Figure( templateName, figure );
            subfigure.children = body.map( node => compile( node, subfigure ) ).filter( notNull );
            figure.addFigure( subfigure );

            figure.addOnUpdate(
                sourceNode( loc, [
                    `            if ( ${childName}.ref ) {\n`,
                    `                ${childName}.ref.update( __data__ );\n`,
                    '            }'
                ] )
            );
        };

        compileBody( node.loc, node.body, templateName, childName );

        figure.addRuntimeImport( 'insert' );
        parent.addBlock(
            sourceNode( node.loc, [
                `            '${blockName}'( node, block ) {\n`,
                `                insert( block, node, ${childName}, ${templateName}, _this.dataForBlock(), ${figure.getPathToDocument()}, _this.blocks );\n`,
                '            }'
            ] )
        );

        return node.reference;
    }
};
