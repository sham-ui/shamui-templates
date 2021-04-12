import { sourceNode } from './sourceNode';
import { Figure } from '../figure';
import { collectVariables } from './variable';
import { isSingleChild, notNull } from '../utils';

export default {
    IfStatement: ( { parent, node, figure, compile } ) => {
        node.reference = null;

        let templateNameForThen = figure.name + '_if' + figure.uniqid( 'template_name' );
        let templateNameForOtherwise = figure.name + '_else' + figure.uniqid( 'template_name' );
        let childNameForThen = 'child' + figure.uniqid( 'child_name' );
        let childNameForOtherwise = 'child' + figure.uniqid( 'child_name' );
        let placeholder;

        if ( isSingleChild( parent, node ) ) {
            placeholder = parent.reference;
        } else {
            node.reference = placeholder = 'for' + figure.uniqid( 'placeholder' );
            figure.domRef = true;
            figure.declare( sourceNode( `const ${placeholder} = dom.comment( '${figure.uniqid( 'comment' )}' );` ) );
        }


        figure.declare( `const ${childNameForThen} = {};` );

        if ( node.otherwise ) {
            figure.declare( `const ${childNameForOtherwise} = {};` );
        }

        // if (

        const variablesOfExpression = collectVariables( figure.getScope(), node.cond );

        figure.thisRef = true;
        figure.addRuntimeImport( 'cond' );

        if ( variablesOfExpression.length > 0 ) {
            figure.spot( variablesOfExpression ).add(
                sourceNode( node.loc, [
                    '                ',
                    node.otherwise ? 'result = ' : '',
                    `cond( _this, ${placeholder}, ${childNameForThen}, ${templateNameForThen}, `, compile(
                        node.cond ), `, ${figure.getPathToDocument()} )`, node.otherwise ? ';' : ''
                ] )
            );

            if ( node.otherwise ) {
                figure.spot( variablesOfExpression ).add(
                    sourceNode( node.loc, [
                        '                ',
                        `cond( _this, ${placeholder}, ${childNameForOtherwise}, ${templateNameForOtherwise}, !result, ${figure.getPathToDocument()} );`
                    ] )
                ).declareVariable( 'result' );
            }
        } else {
            figure.addOnUpdate(
                sourceNode( node.loc, [
                    '            ',
                    node.otherwise ? 'result = ' : '',
                    `cond( _this, ${placeholder}, ${childNameForThen}, ${templateNameForThen}, `, compile(
                        node.cond ), `, ${figure.getPathToDocument()} )`, node.otherwise ? ';' : ''
                ] )
            );

            if ( node.otherwise ) {
                figure.addOnUpdate(
                    sourceNode( node.loc, [
                        '           ',
                        `cond( _this, ${placeholder}, ${childNameForOtherwise}, ${templateNameForOtherwise}, !result, ${figure.getPathToDocument()} )`,
                        node.otherwise ? ';' : ''
                    ] )
                ).declareVariable( 'result' );
            }
        }

        // ) then {

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

        compileBody( node.loc, node.then, templateNameForThen, childNameForThen );

        // } else {

        if ( node.otherwise ) {
            compileBody( node.loc,
                node.otherwise,
                templateNameForOtherwise,
                childNameForOtherwise );
        }

        // }

        return node.reference;
    }
};
