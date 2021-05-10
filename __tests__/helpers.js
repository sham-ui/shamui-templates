import { start, createDI } from 'sham-ui';
import setupUnsafe from 'sham-ui-unsafe';
import { Compiler } from '../src/index';
import { sourceNode } from '../src/compiler/sourceNode';
import { transformSync as babelTransform } from '@babel/core';
import findBabelConfig from 'find-babel-config';

function transformSync( code, config ) {
    return babelTransform( code, config );
}

const compiler = new Compiler( {
    asModule: true
} );

const compilerForSFC = new Compiler( {
    asSingleFileComponent: true,
    asModule: false
} );

// It's hack for don't replace require with webpack require
const requireModule = eval( 'require' );

function evalComponent( code ) {
    const body = [
        'var module=exports;',
        code,
        'return module.exports || exports.default;'
    ].join( '\n' );
    const fn = new Function(
        'require',
        'exports',
        body
    );
    return fn( requireModule, {}, );
}

export function compile( strings ) {
    const node = sourceNode( '' );
    node.add(
        compiler.compile(
            'dummy.sht',
            strings.join( '\n' ).trim()
        )
    );
    const { config } = findBabelConfig.sync( process.cwd() );
    const { code } = transformSync( node.toString(), {
        ...config,
        filename: 'dummy.sht'
    } );
    return evalComponent( code );
}

export function compileWithOptions( options ) {
    const compilerWithOptions = new Compiler( {
        ...options,
        asModule: true
    } );
    return function( strings ) {
        const node = sourceNode( '' );
        node.add(
            compilerWithOptions.compile(
                'dummy.sht',
                strings.join( '\n' ).trim()
            )
        );
        const { config } = findBabelConfig.sync( process.cwd() );
        const { code } = transformSync( node.toString(), {
            ...config,
            filename: 'dummy.sht'
        } );
        return evalComponent( code );
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
    const { config } = findBabelConfig.sync( process.cwd() );
    const { code } = transformSync( node.toString(), {
        ...config,
        filename: 'dummy.sfc'
    } );
    return evalComponent( code );
}

export function renderComponent( componentConstructor, options = {} ) {
    const DI = 'DI' in options ?
        options.DI :
        createDI()
    ;
    setupUnsafe( DI );
    DI.resolve( 'sham-ui:store' ).byId.clear();
    const body = document.querySelector( 'body' );
    body.innerHTML = '';
    const component = new componentConstructor( {
        DI,
        ID: 'dummy',
        container: body,
        ...options
    } );
    start( DI );
    return {
        DI,
        component,
        html: body.innerHTML,
        text: body.textContent
    };
}
