import { start, DI, Component, Map, loop, cond, insert } from 'sham-ui';
import { Compiler } from '../src/index';
import { sourceNode } from '../src/compiler/sourceNode';
import { transformSync } from '@babel/core';
import rootPackage from '../package.json';

const compiler = new Compiler( {
    asModule: false
} );

const compilerForSFC = new Compiler( {
    asSingleFileComponent: true,
    asModule: false
} );

function evalComponent( code ) {
    code = code.replace( /import { .+ } from 'sham-ui';/, '' );
    const fn = new Function( [
        'var require=arguments[0],',
        'Component=arguments[1],',
        'Map=arguments[2],',
        'insert=arguments[3],',
        'cond=arguments[4],',
        'loop=arguments[5];',
        `${code}return dummy;`
    ].join( '' ) );
    return fn( require, Component, Map, insert, cond, loop );
}

export function compile( strings ) {
    const node = sourceNode( '' );
    node.add(
        compiler.compile(
            'dummy.sht',
            strings.join( '\n' ).trim()
        )
    );
    return evalComponent( node.toString() );
}

export function compileWithOptions( options ) {
    const compilerWithOptions = new Compiler( {
        ...options,
        asModule: false
    } );
    return function( strings ) {
        const node = sourceNode( '' );
        node.add(
            compilerWithOptions.compile(
                'dummy.sht',
                strings.join( '\n' ).trim()
            )
        );
        return evalComponent( node.toString() );
    };
}

export function compileAsSFC( strings ) {
    const node = sourceNode( '' );
    node.add(
        compilerForSFC.compile(
            'dummy.sfc',
            strings.join( '\n' ).trim()
        )
    );
    const { code } = transformSync( node.toString(), rootPackage.babel );
    return evalComponent( code );
}

export function renderComponent( componentConstructor, options = {} ) {
    DI.resolve( 'sham-ui:store' ).clear();
    const body = document.querySelector( 'body' );
    body.innerHTML = '';
    const component = new componentConstructor( {
        ID: 'dummy',
        container: body,
        ...options
    } );
    start();
    return {
        component,
        html: body.innerHTML,
        text: body.textContent
    };
}
