import { visit } from '../visitor';
import { ast } from '../parser';

export function thisDollarSign( ast ) {
    visit( ast, {
        MemberExpression: ( node ) => {
            if (
                !node.computed &&
                'Identifier' === node.object.type &&
                'this$' === node.object.name &&
                'Accessor' === node.property.type
            ) {
                replaceWithCallRef( node );
            }
        }
    } );
}

function replaceWithCallRef( node ) {
    node.computed = true;
    node.object = new ast.ThisExpressionNode( node.object.loc );
    node.property = new ast.CallExpressionNode(
        new ast.IdentifierNode( '$' ),
        [ new ast.LiteralNode( `'${node.property.name}'` ) ]
    );
}
