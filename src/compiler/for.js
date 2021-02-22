import { sourceNode } from './sourceNode';
import { collectVariables } from './variable';
import { isSingleChild, esc, notNull } from '../utils';
import { Figure } from '../figure';

export default {
    ForStatement: ( { parent, node, figure, compile } ) => {
        node.reference = null;

        let templateName = figure.name + '_for' + figure.uniqid( 'template_name' );
        let childrenName = 'children' + figure.uniqid( 'child_name' );
        let placeholder;

        if ( isSingleChild( parent, node ) ) {
            placeholder = parent.reference;
        } else {
            node.reference = placeholder = 'for' + figure.uniqid( 'placeholder' );
            figure.domRef = true;
            figure.declare( sourceNode( `const ${placeholder} = dom.comment( 'for' );` ) );
        }

        figure.addRuntimeImport( 'loop' );
        figure.addRuntimeImport( 'Map' );
        figure.declare( sourceNode( `const ${childrenName} = new Map();` ) );

        // for (

        figure.thisRef = true;

        let variablesOfExpression = collectVariables( figure.getScope(), node.expr );

        if ( variablesOfExpression.length > 0 ) {
            figure.spot( variablesOfExpression ).add(
                sourceNode( node.loc, [
                    `                loop( _this, ${placeholder}, ${childrenName}, ${templateName}, `,
                    compile( node.expr ),
                    ', ',
                    (
                        node.options === null ? 'null' : esc( node.options )
                    ),
                    `, ${figure.getPathToDocument()}`,
                    ' )'
                ] )
            );
        }  else {
            figure.addOnUpdate(
                sourceNode( node.loc, [
                    `            loop( _this, ${placeholder}, ${childrenName}, ${templateName}, `,
                    compile( node.expr ),
                    ', ',
                    (
                        node.options === null ? 'null' : esc( node.options )
                    ),
                    `, ${figure.getPathToDocument()}`,
                    ' )'
                ] )

            );
        }

        // ) {

        let subfigure = new Figure( templateName, figure );

        if ( node.body.length > 0 ) {
            subfigure.children = node.body.map( ( node ) => compile( node, subfigure ) )
                .filter( notNull );
            figure.addFigure( subfigure );
        }

        figure.addOnUpdate(
            node.options === null ?
                sourceNode( node.loc, [
                    `            ${childrenName}.forEach( ( view ) => view.update( view.__state__ ) );`
                ] ) :
                sourceNode( node.loc, [
                    `            ${childrenName}.forEach( ( view ) => view.update( Object.assign( {}, __data__, view.__state__ ) ) );`
                ] )
        );

        if ( node.options && node.options.value ) {
            subfigure.spot( node.options.value ).onlyFromLoop = true;
        }

        if ( node.options && node.options.key ) {
            subfigure.spot( node.options.key ).onlyFromLoop = true;
        }

        // }

        return node.reference;
    }
};
