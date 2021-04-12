import { compile, renderComponent } from './helpers';

beforeEach( () => {
    window.CustomPanel = compile`
        <h1>{{ title }}</h1>
        <div>
            {{ content }}
        </div>
    `;
} );

afterEach( () => {
    delete window.CustomPanel;
} );

it( 'should properly work with attributes', async() => {
    expect.assertions( 2 );
    const { component, html } = await renderComponent(
        compile`
            <div>
                <CustomPanel title="string" content="text"/>
                <CustomPanel title="{{ value }}" content="{{ text }}"/>
            </div>
        `,
        {
            value: 'title',
            text: 'content'
        }
    );
    expect( html ).toBe(
        // eslint-disable-next-line max-len
        '<div><h1>string</h1><div>text</div><!--0--><h1>title</h1><div>content</div><!--1--></div>'
    );
    component.update( { value: 'updated' } );
    expect( component.container.innerHTML ).toBe(
        // eslint-disable-next-line max-len
        '<div><h1>string</h1><div>text</div><!--0--><h1>updated</h1><div>content</div><!--1--></div>'
    );
} );
