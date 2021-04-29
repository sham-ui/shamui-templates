import { compileAsSFC, renderComponent } from './helpers';

it( 'function bind correctly work with directives', () => {
    class OnClickEventListener {
        constructor() {
            this.handler = null;
            this.callback = this.callback.bind( this );
        }

        callback( event ) {
            this.handler( event );
        }

        bind( node ) {
            node.addEventListener( 'click', this.callback );
        }

        unbind( node ) {
            node.removeEventListener( 'click', this.callback );
        }

        update( handler ) {
            this.handler = handler;
        }
    }

    const handler = jest.fn();
    const { html, component } = renderComponent(
        compileAsSFC`
            <template>
                <button :onclick={{::this.click}}>click me</button>
            </template>
            
            <script>
                export default Component( Template, function() {
                    this.click = ( e ) => {
                        this.options.handler( this, e.type );
                    }
                } );
            </script>
        `,
        {
            directives: {
                onclick: OnClickEventListener
            },
            handler
        }
    );
    expect( html ).toBe(
        '<button>click me</button>'
    );
    component.container.querySelector( 'button' ).click();

    expect( handler ).toHaveBeenCalledTimes( 1 );
    expect( handler ).toHaveBeenCalledWith( component, 'click' );
} );
