import { compile, compileWithOptions, renderComponent } from './helpers';

it( 'by default removeDataTest enabled', () => {
    const { html } = renderComponent( compile`<div data-test-text>test</div>` );
    expect( html ).toBe( '<div>test</div>' );
} );

it( 'disable removeDataTest', () => {
    const { html } = renderComponent(
        compileWithOptions( { removeDataTest: false } )`<div data-test-text>test</div>`
    );
    expect( html ).toBe( '<div data-test-text="">test</div>' );
} );

it( 'disable removeDataTest with if', () => {
    const { html } = renderComponent(
        compileWithOptions( { removeDataTest: false } )`
            {% if visible %}
                <div data-test-text>test</div>
            {% endif %}
        `,
        {
            visible: true
        }
    );
    expect( html ).toBe( '<div data-test-text="">test</div><!--0-->' );
} );

it( 'disable removeDataTest with for', () => {
    const { html } = renderComponent(
        compileWithOptions( { removeDataTest: false } )`
            {% for key, value of items %}
                <div data-test-item={{key}}> {{ value }} </div>
            {% endfor %}
        `,
        {
            items: [ 5, 6, 7 ]
        }
    );
    expect( html ).toBe(
        // eslint-disable-next-line max-len
        '<div data-test-item="0">5</div><div data-test-item="1">6</div><div data-test-item="2">7</div><!--0-->'
    );
} );
