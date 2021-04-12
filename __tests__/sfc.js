import { compileAsSFC, renderComponent, compile } from './helpers';

it( 'should single file component work', async() => {
    expect.assertions( 2 );
    const { component, html } = await renderComponent(
        compileAsSFC`
        <template>
            {% if loaded %}
                Loaded!
            {% endif %}
        </template>
        
        <script>
            class dummy extends Template {
                
            }
        </script>
        `,
        {
            loaded: false
        }
    );
    expect( html ).toBe( '<!--0-->' );
    component.update( { loaded: true } );
    expect( component.container.innerHTML ).toBe( ' Loaded! <!--0-->' );
} );

it( 'should single file component correct work with options', async() => {
    expect.assertions( 2 );
    const { component, html } = await renderComponent(
        compileAsSFC`
        <template>
            {% if loaded %}
                {{text}}
            {% endif %}
        </template>
        
        <script>
            import { options } from 'sham-ui';
            class dummy extends Template {
                @options get text() {
                    return 'Text for content'
                }
            }
        </script>
        `,
        {
            loaded: false
        }
    );
    expect( html ).toBe( '<!--0-->' );
    component.update( { loaded: true } );
    expect( component.container.innerHTML ).toBe( 'Text for content<!--0-->' );
} );

it( 'should single file component correct work with imports', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compileAsSFC`
        <template>
            {% import upperCase from 'upper-case' %}

            <section>
                {{ upperCase(text) | upperCase }}
            </section>
        </template>
        
        <script>
            import { options } from 'sham-ui';
            class dummy extends Template {
                @options text = 'default text';
            }
        </script>
        `,
        {
            text: 'upper'
        }
    );
    expect( html ).toBe( '<section>UPPER</section>' );
} );


it( 'should single file component correct work with context in blocks', async() => {
    expect.assertions( 1 );
    window.CustomPanel = compile`
        <div>
            <div class="title">
                {% defblock 'title' %}
            </div>
        </div>
    `;
    const { html } = await renderComponent(
        compileAsSFC`
        <template>
            <CustomPanel>
                {% block 'title' %}
                    {{this.title()}}
                {% endblock %}
            </CustomPanel>
        </template>
        
        <script>
            class dummy extends Template {
                title() {
                    return 'Title text'
                };
            }
        </script>
        `
    );
    expect( html ).toBe(
        '<div><div class="title"> Title text <!--0--></div></div><!--0-->'
    );

    delete window.CustomPanel;
} );

it( 'should work with class getters in expressions', () => {
    const { html } = renderComponent(
        compileAsSFC`
        <template>
            <span>{{this.user}}</span>
        </template>
        
        <script>
            class dummy extends Template {
                get user() {
                    return 'John Smith';
                };
            }
        </script>
        `
    );
    expect( html ).toBe( '<span>John Smith</span>' );
} );

it( 'should work with class getters in if', () => {
    const { html } = renderComponent(
        compileAsSFC`
        <template>
            {% if this.isVisible %}
                <span>{{user}}</span>
            {% endif %}
        </template>
        
        <script>
            class dummy extends Template {
                get isVisible() {
                    return true;
                };
            }
        </script>
        `,
        {
            user: 'Joh Smith'
        }
    );
    expect( html ).toBe( '<span>Joh Smith</span><!--0-->' );
} );

it( 'should work with class getters in for', () => {
    const { html } = renderComponent(
        compileAsSFC`
        <template>
            <ul>
                {% for user of this.userList %}
                    <li>{{user}}</li>
                {% endfor %}
            </ul>
        </template>
        
        <script>
            class dummy extends Template {
                get userList() {
                    return [ 
                        'John Smith',
                        'Adam Mock'
                     ]
                };
            }
        </script>
        `
    );
    expect( html ).toBe(
        '<ul><li>John Smith</li><li>Adam Mock</li></ul>'
    );
} );
