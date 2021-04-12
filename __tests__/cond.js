import { compile, renderComponent } from './helpers';

it( 'should properly work', async()=>  {
    expect.assertions( 5 );
    {
        const { html, component } = await renderComponent(
            compile`
                <div>
                    {% if test %}true: {{ context }}{% endif %}
                </div>
            `
            ,
            {
                test: true,
                context: 'parent data'
            }
        );
        expect( html ).toBe( '<div>true: parent data</div>' );
        component.update( { test: false } );
        expect( component.container.innerHTML ).toBe( '<div></div>' );

        component.update( { test: true } );
        expect( component.container.innerHTML ).toBe( '<div>true: parent data</div>' );
    }
    {
        const { html, component } = await renderComponent(
            compile`
                <div>
                    {% if test %}
                        then
                    {% else %}
                        else
                    {% endif %}
                </div>
            `,
            {
                test: true
            }
        );
        expect( html ).toBe( '<div> then </div>' );
        component.update( { test: false } );
        expect( component.container.innerHTML ).toBe( '<div> else </div>' );
    }
} );

it( 'should work with expression', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <div>    
                {% if array.indexOf(1) != -1 %}
                    (one)
                {% endif %}
                {% if array.indexOf(look) != -1 %}
                    {{ look }}
                    <p>{{ indep }}</p>
                {% endif %}
            </div>
        `,
        {
            array: [ 1, 2, 3, 4, 5 ],
            look: 3,
            indep: 'independent'
        }
    );
    expect( html ).toBe( '<div> (one) <!--0-->3<p>independent</p><!--1--></div>' );
    component.update( { look: 2 } );
    expect( component.container.innerHTML ).toBe(
        '<div> (one) <!--0-->2<p>independent</p><!--1--></div>'
    );
} );

it( 'should update only one view', async() => {
    expect.assertions( 4 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% if test %}
                    {{ value }}
                {% endif %}
            </div>
        `
        ,
        {
            test: true,
            value: 'old'
        }
    );
    expect( html ).toBe( '<div>old</div>' );
    component.update( { test: false, value: 'new' } );
    expect( component.container.innerHTML ).toBe( '<div></div>' );

    component.update( { test: true } );
    expect( component.container.innerHTML ).toBe( '<div>new</div>' );

    component.update( { test: true, value: 'new' } );
    expect( component.container.innerHTML ).toBe( '<div>new</div>' );
} );
