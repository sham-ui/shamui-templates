import { sourceNode } from './sourceNode';
import { notNull } from '../utils';

export default {
    Document: ( { node, figure, compile, options } ) => {
        figure.children = node.body.map( ( child ) => compile( child ) ).filter( notNull );

        if ( options.asModule ) {
            return sourceNode( node.loc, [
                figure.generate(), '\n',
                `export default ${figure.name};\n`
            ] );
        } else if ( options.asSingleFileComponent ) {
            return sourceNode( node.loc, [ figure.generate() ] );
        } else {
            return sourceNode( node.loc, [
                figure.generate(), '\n',
                `window.${figure.name} = ${figure.name};\n`
            ] );
        }
    }
};


