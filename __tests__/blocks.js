import { compile, compileAsSFC, renderComponent } from './helpers';

beforeEach( () => {
    window.LinkTo = compile`
        <a href={{url}}>
            {% defblock %}
        </a>
    `;

    window.DisplayContent = compile`
        {% if condition %}
            {% defblock %}
        {% endif %}
    `;
    window.TextContent = compile`
        <span>
            {% defblock %}
        </span>
    `;
} );

afterEach( () => {
    delete window.LinkTo;
    delete window.DisplayContent;
    delete window.TextContent;
} );

it( 'should work with {% block "default" %}', () => {
    const { html } = renderComponent(
        compile`
            <div>
                <LinkTo>
                    {% block 'default' %}
                        Text for content
                    {% endblock %}
                </LinkTo>
            </div>
        `,
        {}
    );
    expect( html ).toBe(
        '<div><a> Text for content <!--0--></a></div>'
    );
} );

it( 'should work with two named blocks', () => {
    window.CustomPanel = compile`
        <div>
            <div class="title">
                {% defblock 'title' %}
            </div>
            <div class="content">
                {% defblock %}
            </div>
        </div>
    `;
    const { html } = renderComponent(
        compile`
            <div>
                <CustomPanel>
                    {% block 'title' %}
                        Text for title
                    {% endblock %}

                    {% block 'default' %}
                        Text for content
                    {% endblock %}
                </CustomPanel>
            </div>
        `,
        {}
    );
    expect( html ).toBe(
        // eslint-disable-next-line max-len
        '<div><div><div class="title"> Text for title <!--0--></div><div class="content"> Text for content <!--1--></div></div></div>'
    );
    delete window.CustomPanel;
} );

it( 'should work with component arguments', () => {
    const { html, component } = renderComponent(
        compile`
            <div>
                <LinkTo url={{url}}>
                    {% block 'default' %}
                        Text for {{url}}
                    {% endblock %}
                </LinkTo>
            </div>
        `,
        {
            url: 'http://example.com'
        }
    );
    expect( html ).toBe(
        '<div><a href="http://example.com"> Text for http://example.com <!--0--></a></div>'
    );

    component.update( {
        url: 'http://foo.example.com'
    } );
    expect( component.container.innerHTML ).toBe(
        // eslint-disable-next-line max-len
        '<div><a href="http://foo.example.com"> Text for http://foo.example.com <!--0--></a></div>'
    );
} );

it( 'should work with component default block', () => {
    const { html, component } = renderComponent(
        compile`
            <div>
                <LinkTo url={{url}}>
                    Text for {{url}}
                </LinkTo>
            </div>
        `,
        {
            url: 'http://example.com'
        }
    );
    expect( html ).toBe(
        '<div><a href="http://example.com"> Text for http://example.com<!--0--></a></div>'
    );

    component.update( {
        url: 'http://foo.example.com'
    } );
    expect( component.container.innerHTML ).toBe(
        // eslint-disable-next-line max-len
        '<div><a href="http://foo.example.com"> Text for http://foo.example.com<!--0--></a></div>'
    );
} );

it( 'should remove block in if', () => {
    window.VisibleBlock = compile`
        {% if visible %}
            <div class="content">
                {% defblock %}
            </div>
        {% endif %}
    `;
    const { html, component } = renderComponent(
        compile`
            <VisibleBlock visible={{visible}}>
                Text content for {{data}}
            </VisibleBlock>
        `,
        {
            visible: true,
            data: 'foo'
        }
    );
    expect( html ).toBe(
        '<div class="content"> Text content for foo<!--0--></div><!--0--><!--0-->'
    );

    component.update( {
        visible: false,
        data: 'foz'
    } );
    expect( component.container.innerHTML ).toBe( '<!--0--><!--0-->' );

    component.update( {
        visible: true,
        data: 'foo'
    } );
    expect( component.container.innerHTML ).toBe(
        '<div class="content"> Text content for foo<!--0--></div><!--0--><!--0-->'
    );
    delete window.VisibleBlock;
} );

it( 'should work with two nested if', () => {
    window.BigRedButton = compile`
        {% if big %}
            {% if red %} 
                <button class="big red">This button big={{big}}, red={{red}}{% defblock %}</button>
            {% endif %}
        {% endif %}
    `;
    const { html, component } = renderComponent(
        compile`
            <BigRedButton big={{big}} red={{red}}>
                big && red
            </BigRedButton>
        `,
        {
            big: false,
            red: false
        }
    );
    expect( html ).toBe( '<!--0--><!--0-->' );

    component.update( {
        big: true
    } );
    expect( component.container.innerHTML ).toBe( '<!--0--><!--0--><!--0-->' );

    component.update( {
        red: true
    } );
    expect( component.container.innerHTML ).toBe(
        // eslint-disable-next-line max-len
        '<button class="big red">This button big=true, red=true big &amp;&amp; red <!--0--></button><!--0--><!--0--><!--0-->'
    );
    delete window.BigRedButton;
} );

it( 'should work with defblock nested in useblock', () => {
    window.LoadedContainer = compile`
        {% if loaded %}
            {% defblock %}
        {% endif %}
    `;
    window.LoadedVisibleContainer = compile`
        <LoadedContainer loaded={{loaded}}>
            {% if visible %}
                {% defblock %}
            {% endif %}
        </LoadedContainer>
    `;
    window.RedLoadedVisibleContainer = compile`
        <LoadedVisibleContainer loaded={{loaded}} visible={{visible}}>
            {% if red %}
                {% defblock %}            
            {% endif %}
        </LoadedVisibleContainer>
    `;
    const { html, component } = renderComponent(
        compile`
            <RedLoadedVisibleContainer loaded={{loaded}} visible={{visible}} red={{red}}>
                red && loaded & visible
            </RedLoadedVisibleContainer>
        `,
        {
            red: false,
            loaded: false,
            visible: false
        }
    );
    expect( html ).toBe(
        // eslint-disable-next-line max-len
        '<!--0--><!--0--><!--0--><!--0-->'
    );

    component.update( {
        loaded: true
    } );
    expect( component.container.innerHTML ).toBe(
        '<!--0--><!--0--><!--0--><!--0--><!--0--><!--0-->'
    );

    component.update( {
        visible: true
    } );
    expect( component.container.innerHTML ).toBe(
        '<!--0--><!--0--><!--0--><!--0--><!--0--><!--0--><!--0--><!--0-->'
    );
    component.update( {
        red: true
    } );
    expect( component.container.innerHTML ).toBe(
        // eslint-disable-next-line max-len
        ' red &amp;&amp; loaded &amp; visible <!--0--><!--0--><!--0--><!--0--><!--0--><!--0--><!--0--><!--0--><!--0-->'
    );
    delete window.LoadedContainer;
    delete window.LoadedVisibleContainer;
    delete window.RedLoadedVisibleContainer;
} );

it( 'should work with for', () => {
    const { html, component } = renderComponent(
        compile`
            <ul>
                {% for url of links %}
                    <li>
                        <LinkTo url={{url}}>Text for {{url}}</LinkTo>
                    </li>
                {% endfor %}
            </ul>
            <LinkTo url="http://example.com">Home</LinkTo>
        `,
        {
            links: [
                'http://foo.example.com',
                'http://bar.example.com',
                'http://baz.example.com'
            ]
        }
    );
    expect( html ).toBe(
        '<ul>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://foo.example.com">Text for http://foo.example.com<!--0--></a></li>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://bar.example.com">Text for http://bar.example.com<!--0--></a></li>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://baz.example.com">Text for http://baz.example.com<!--0--></a></li>' +
        '</ul>' +
        '<a href="http://example.com">Home<!--0--></a><!--0-->'
    );

    component.update( {
        links: [
            'http://baz.example.com',
            'http://bar.example.com',
            'http://foo.example.com'
        ]
    } );
    expect( component.container.innerHTML ).toBe(
        '<ul>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://baz.example.com">Text for http://baz.example.com<!--0--></a></li>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://bar.example.com">Text for http://bar.example.com<!--0--></a></li>' +
            // eslint-disable-next-line max-len
            '<li><a href="http://foo.example.com">Text for http://foo.example.com<!--0--></a></li>' +
        '</ul>' +
        '<a href="http://example.com">Home<!--0--></a><!--0-->'
    );
} );

it( 'should work useblock if was update from block component', () => {
    const { component, DI } = renderComponent(
        compile`
            <DisplayContent>
                Content
            </DisplayContent>
        `,
        {

        }
    );
    expect( component.container.textContent.trim() ).toBe( '' );

    const displayContent = Array.from( DI.resolve( 'sham-ui:store' ).byId.values() ).find(
        x => x instanceof window.DisplayContent
    );
    displayContent.update( { condition: true } );
    expect( component.container.textContent.trim() ).toBe( 'Content' );

    displayContent.update( { condition: false } );
    expect( component.container.textContent.trim() ).toBe( '' );
} );


it( 'should correct resolve owner', () => {
    const { component } = renderComponent(
        compileAsSFC`
            <template>
                <TextContent>
                    <TextContent>
                        {{this._text()}}
                    </TextContent>
                </TextContent>
            </template>
            
            <script>
                export default Component( Template, function( options ) {
                    options( {
                        text: () => 'Text for content'
                    } );
                    this._text = () => this.options.text();
                } )
            </script>
        `
    );
    expect( component.container.textContent.trim() ).toBe( 'Text for content' );
} );


