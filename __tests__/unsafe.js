import { compile, renderComponent } from './helpers';

it( 'should insert constants as HTML', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <div>
                {% unsafe "<br>" %}
            </div>
        `
    );
    expect( html ).toBe( '<div><br></div>' );
} );


it( 'should insert variables as HTML', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% unsafe html %}
            </div>
        `
    );
    expect( html ).toBe( '<div></div>' );

    component.update( { html: '<a href="javascript:XSS;">Link</a>' } );
    expect( component.container.innerHTML ).toBe( '<div><a href="javascript:XSS;">Link</a></div>' );
} );

it( 'should remove old DOM nodes and insert new', async() => {
    expect.assertions( 4 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% unsafe html %}
            </div>
        `,
        {
            html: '<div>foo</div><br>'
        }
    );
    expect( html ).toBe( '<div><div>foo</div><br></div>' );

    component.update( { html: '<input type="datetime"><hr><div>baz</div>' } );
    expect( component.container.innerHTML ).toBe(
        '<div><input type="datetime"><hr><div>baz</div></div>'
    );

    component.update( { html: '' } );
    expect( component.container.innerHTML ).toBe( '<div></div>' );

    component.update( { html: '<!-- comment -->' } );
    expect( component.container.innerHTML ).toBe( '<div><!-- comment --></div>' );
} );

it( 'should insert unsafe with placeholders', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% unsafe "<br>" %}
                {% unsafe html %}
            </div>
        `,
        {
            html: '<hr>'
        }
    );
    expect( html ).toBe( '<div><br><!--0--><hr><!--1--></div>' );

    component.update( { html: '<br><!-- comment --><link href="http://ShamUIView.js.org">' } );
    expect( component.container.innerHTML ).toBe(

        // eslint-disable-next-line max-len
        '<div><br><!--0--><br><!-- comment --><link href="http://ShamUIView.js.org"><!--1--></div>'
    );
} );

it( 'if with unsafe tag', async() => {
    expect.assertions( 3 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% if test %}
                    <div>
                        {% unsafe "<i>unsafe</i>" %}
                    </div>
                {% endif %}
            </div>
        `,
        {
            test: true
        }
    );
    expect( html ).toBe( '<div><div><i>unsafe</i></div></div>' );

    component.update( { test: false } );
    expect( component.container.innerHTML ).toBe( '<div></div>' );

    component.update( { test: true } );
    expect( component.container.innerHTML ).toBe( '<div><div><i>unsafe</i></div></div>' );
} );


it( 'should work with first level non-elements', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            text
            {% if condition %}
                <div class="if">ok</div>
            {% endif %}
            {% for items %}
                <div class="for">ok</div>
            {% endfor %}
            <div on="{{ tag }}">
                <div class="custom">ok</div>
            </div>
            {% unsafe "<i class='unsafe'>" + xss + "</i>" %}
        `,
        {
            condition: true,
            items: [ 1, 2, 3 ],
            tag: true,
            xss: 'ok'
        }
    );
    expect( html ).toBe(
        //eslint-disable-next-line max-len
        'text <div class="if">ok</div><!--0--><div class="for">ok</div><div class="for">ok</div><div class="for">ok</div><!--1--><div on="true"><div class="custom">ok</div></div><i class="unsafe">ok</i><!--2-->'
    );
} );
