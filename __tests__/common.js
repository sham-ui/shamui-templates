import { compile, renderComponent } from './helpers';

it( 'should render simple DOM', async() => {
    expect.assertions( 2 );
    const { html, text } = await renderComponent( compile`<div>test</div>` );
    expect( html ).toBe( '<div>test</div>' );
    expect( text ).toBe( 'test' );
} );


it( 'should insert variable as text node', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`<p>{{ text }}</p>`,
        {
            text: 'To understand what recursion is, you must first understand recursion.'
        }
    );
    expect( html ).toBe(
        '<p>To understand what recursion is, you must first understand recursion.</p>'
    );
} );


it( 'should insert variable in attributes', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`<input type="text" value="{{ value }}">`,
        {
            value: 'Value'
        }
    );
    expect( component.nodes[ 0 ].value ).toEqual( 'Value' );
    expect( html ).toBe( '<input type="text">' );
} );


it( 'should properly work with text constants in text nodes', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`<p>foo {{ bar }} baz</p>`,
        {
            bar: 'bar'
        }
    );
    expect( html ).toBe( '<p>foo bar baz</p>' );
} );

it( 'should properly work with text constants in attributes', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`<div class="foo {{ bar }} baz"></div>`,
        {
            bar: 'bar'
        }
    );
    expect( html ).toBe( '<div class="foo bar baz"></div>' );
} );


it( 'should save value for variables in complex cases', async() => {
    expect.assertions( 2 );
    const { component, html } = await renderComponent(
        compile`<div class="{{ foo }} {{ bar }}"></div>`,
        {
            foo: 'first',
            bar: 'second'
        }
    );
    expect( html ).toBe( '<div class="first second"></div>' );
    component.update( {
        foo: 'updated'
    } );
    expect( component.container.innerHTML ).toBe( '<div class="updated second"></div>' );
} );


it( 'should properly work with more then one node on topmost level', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
        <p>first</p>

        <p>second</p>
        `
    );
    expect( html ).toBe( '<p>first</p><p>second</p>' );
} );

it( 'should optimize "if"/"for" tag, if it is only child', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
        <div>
            <p>
                {% if a %}a{% endif %}
            </p>

            <p>
                {% for b %}b{% endfor %}
            </p>
        </div>
        `,
        {
            a: true,
            b: [ 1 ]
        }
    );
    expect( html ).toBe( '<div><p>a</p><p>b</p></div>' );
} );

it( 'should place placeholders for multiply "if" tags', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
        <div>
            {% if a %}a{% endif %}
            {% if b %}b{% endif %}
        </div>
        `
    );
    expect( html ).toBe( '<div><!--0--><!--1--></div>' );
} );

it( 'should place placeholders for multiply "if" and "for" tags', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
        <div>
            {% if a %}a{% endif %}
            {% for b %}i{% endfor %}
        </div>
        `
    );
    expect( html ).toBe( '<div><!--0--><!--1--></div>' );
} );


it( 'should properly for with filters', async() => {
    expect.assertions( 1 );
    const filters = {
        append: function( value, text ) {
            return value + text;
        },
        upperCase: function( value ) {
            return value.toUpperCase();
        }
    };
    const { html } = await renderComponent(
        compile`<p>{{ text | append('case') | upperCase }}</p>`,
        { filters, text: 'upper_' }
    );
    expect( html ).toBe( '<p>UPPER_CASE</p>' );
} );


it( 'should work with expressions', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
        <a title="{{ (a + b) * c / d }}">{{ more.amazing + features[0] + features[1] }}</a>
        `,
        {
            a: 1,
            b: 2,
            c: 100,
            d: 2,
            more: {
                amazing: 'a'
            },
            features: [ 'b', 'c' ]
        }
    );
    expect( html ).toBe( '<a title="150">abc</a>' );
    component.update( { more: { amazing: 'Amazing!' } } );
    expect( component.container.innerHTML ).toBe( '<a title="150">Amazing!bc</a>' );
} );

it( 'should render empty attributes', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`<input type="checkbox" value="" checked>`
    );
    expect( html ).toBe( '<input type="checkbox" value="">' );
    expect( component.nodes[ 0 ].checked ).toEqual( true );
} );

it( 'should render attributes without quotes', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`<div class={{ name }}></div>`,
        {
            name: 'name'
        }
    );
    expect( html ).toBe( '<div class="name"></div>' );
} );

it( 'should support global variables', async() => {
    expect.assertions( 2 );
    const first = await renderComponent(
        compile`
        <i>
            {{ host == window.location.host ? 'expr' : '' }},
            {% if host == window.location.host %}if{% endif %},
            {% for i of [host == window.location.host] %}{{ i ? 'for' : '' }}{% endfor %},
            <i class="{{ host == window.location.host ? 'attr' : '' }}"></i>
        </i>
        `,
        {
            host: window.location.host
        }
    );
    expect( first.html ).toBe(
        '<i>expr, if<!--0-->, for<!--1-->, <i class="attr"></i></i>'
    );

    const second = await renderComponent(
        compile`
            {{ Array.isArray(array) ? 'array' : '' }},
            {{ Math.pow(2, 2) }},
            {{ Object.keys(obj).join(';') }},
            {{ JSON.stringify(obj) }}
        `,
        {
            array: [ 1, 2, 3 ],
            obj: { a: 1, b: 2 }
        }
    );
    expect( second.html ).toBe( 'array, 4, a;b, {"a":1,"b":2}' );
} );

it( 'should support expressions without variables', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`{{ 1 + 2 * 3 }}`
    );
    expect( html ).toBe( '7' );
} );

it( 'should ignore all html comments', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <!-- comment with <tags> and {{ expr }}, {% tags %}, --, #, //, >. (c). -->
            <span>Moon</span>
        `
    );
    expect( html ).toBe( '<span>Moon</span>' );
} );

it( 'should replace HTML entities with Unicode symbols', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`&quot;&amp;&apos;&lt;&gt;&copy;&pound;&plusmn;&para;&ensp;&mdash;&emsp;&euro;&thinsp;&hearts;&notExists;`
    );
    expect( html ).toBe( '"&amp;\'&lt;&gt;©£±¶ — € ♥&amp;notExists;' );
} );

it( 'should ignore script tag content', () => {
    const { html } = renderComponent(
        compile`<script> var result = 2 < 5;</script>`
    );
    expect( html ).toBe( '<script> var result = 2 < 5;</script>' );
} );

it( 'should support style attribute', () => {
    const { html } = renderComponent(
        compile`<div \\style="background-color: red">DANGER</div>`
    );
    expect( html ).toBe( '<div style="background-color: red">DANGER</div>' );
} );
