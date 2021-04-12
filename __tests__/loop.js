import { compile, renderComponent } from './helpers';

beforeEach( () => {
    window.MyLi = compile`
        <li>{{ props.id + ':' + props.value }}</li>
    `;
    window.MyUl = compile`
        <ul>
            {% for element of list %}
                <MyLi props="{{ element }}"/>
            {% endfor %}
        </ul>
    `;
} );

afterEach( () => {
    delete window.MyLi;
    delete window.MyUl;
} );


it( 'should render arrays', async() => {
    expect.assertions( 3 );
    const { html, component } = await renderComponent(
        compile`
            <ul>
                {% for key, value of list %}
                    <li>{{ key }}:{{ value }}</li>
                {% endfor %}
            </ul>
        `,
        {
            list: [ 1, 2, 3 ]
        }
    );
    expect( html ).toBe( '<ul><li>0:1</li><li>1:2</li><li>2:3</li></ul>' );

    component.update( { list: [ 1, 3 ] } );
    expect( component.container.innerHTML ).toBe( '<ul><li>0:1</li><li>1:3</li></ul>' );

    component.update( { list: [ 'a', 'b', 'c', 'd' ] } );
    expect( component.container.innerHTML ).toBe(
        '<ul><li>0:a</li><li>1:b</li><li>2:c</li><li>3:d</li></ul>'
    );
} );

it( 'should render arrays with externals', async() =>{
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <div>
                {% for value of list %}
                    <p>{{ value }}{{ ext }}</p>
                {% endfor %}
            </div>
        `,
        {
            list: [ 1, 2, 3 ],
            ext: '.js'
        }
    );
    expect( html ).toBe( '<div><p>1.js</p><p>2.js</p><p>3.js</p></div>' );
} );

it( 'should iterate over objects', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% for key, value of obj %}
                    {{ key }}: {{ value }};
                {% endfor %}
            </div>
        `,
        {
            obj: {
                a: 1,
                b: 2,
                c: 3
            }
        }
    );
    expect( html ).toBe( '<div>a: 1; b: 2; c: 3; </div>' );

    component.update( {
        obj: {
            a: 1,
            c: 3,
            d: 4
        }
    } );
    expect( component.container.innerHTML ).toBe( '<div>a: 1; c: 3; d: 4; </div>' );
} );

it( 'should iterate over arrays without options', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <div>
                {% for obj %}
                    {{ name }};
                {% endfor %}
            </div>
        `,
        {
            obj: [
                { name: 'a' },
                { name: 'b' },
                { name: 'c' }
            ]
        }
    );
    expect( html ).toBe( '<div>a; b; c; </div>' );
} );

it( 'should delete old items from childred map with custom tag', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                <MyUl list="{{ list }}"/>
            </div>
        `,
        {
            list: [
                {
                    id: 1,
                    value: 'a'
                },
                {
                    id: 2,
                    value: 'b'
                },
                {
                    id: 3,
                    value: 'c'
                }
            ]
        }
    );
    expect( html ).toBe(
        '<div><ul><li>1:a</li><!--0--><li>2:b</li><!--0--><li>3:c</li><!--0--></ul></div>'
    );

    component.update( {
        list: [
            {
                id: 1,
                value: 'a'
            },
            {
                id: 3,
                value: 'c'
            }
        ]
    } );
    expect( component.container.innerHTML ).toBe(
        '<div><ul><li>1:a</li><!--0--><li>3:c</li><!--0--></ul></div>'
    );
} );

it( 'should not expose local variables', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <section>
                {% for a of as %}
                    <i>
                        {% for b of bs %}
                            <b>{{ b }}</b>
                        {% endfor %}
                    </i>
                {% endfor %}
            </section>
        `,
        {
            as: [ 'a', 'b' ],
            bs: [ 1, 2 ],
            b: 'GLOBAL'
        }
    );
    expect( html ).toBe(
        '<section><i><b>1</b><b>2</b></i><i><b>1</b><b>2</b></i></section>'
    );
} );
