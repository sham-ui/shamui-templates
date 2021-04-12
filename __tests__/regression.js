import { compile, renderComponent } from './helpers';

beforeEach( () => {
    window.Tag = compile`
        <div> Custom tag </div>
    `;
    window[ 'custom_tag_with_loop' ] = compile`
        <em>
            {% for item of list %}
                <b class="{{ foo }}{{ bar }}">{{ item }}</b>
            {% endfor %}
        </em>
    `;
} );
afterEach( () => {
    delete window.Tag;
    delete window[ 'custom_tag_with_loop' ];
} );

afterAll( () => {
    document.body.innerHTML = '';
} );

it( 'should update all values', async() => {
    expect.assertions( 6 );
    const RegressionParentValues = await renderComponent(
        compile`
            <p>{{ value }}</p>
            <p>{% if on %}{{ value }}{% endif %}</p>
            <p>{% for i of each %}{{ value }}{% endfor %}</p>
        `,
        {
            value: 1,
            on: true,
            each: [ 1, 2, 3 ]
        }
    );
    expect( RegressionParentValues.html ).toBe( '<p>1</p><p>1</p><p>111</p>' );

    RegressionParentValues.component.update( { value: 2 } );
    expect( RegressionParentValues.component.container.innerHTML ).toBe(
        '<p>2</p><p>2</p><p>222</p>'
    );

    const RegressionParentValuesComplex = await renderComponent(
        compile`
            <p>{{ a + b }}</p>
            <p>{% if on %}{{ a - b }}{% endif %}</p>
            <p>{% for i of each %}{{ a * b }}{% endfor %}</p>
        `,
        {
            a: 2,
            b: 3,
            on: true,
            each: [ 1, 2 ]
        }
    );
    expect( RegressionParentValuesComplex.html ).toBe( '<p>5</p><p>-1</p><p>66</p>' );

    RegressionParentValuesComplex.component.update( { a: 4 } );
    expect( RegressionParentValuesComplex.component.container.innerHTML ).toBe(
        '<p>7</p><p>1</p><p>1212</p>'
    );

    RegressionParentValuesComplex.component.update( { b: 1 } );
    expect( RegressionParentValuesComplex.component.container.innerHTML ).toBe(
        '<p>5</p><p>3</p><p>44</p>'
    );

    RegressionParentValuesComplex.component.update( { a: 2, b: 2 } );
    expect( RegressionParentValuesComplex.component.container.innerHTML ).toBe(
        '<p>4</p><p>0</p><p>44</p>'
    );
} );

it( 'should update variables in nested views', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <p>
                {% for i of each %}
                    {% if on %}
                        {{ value }}
                    {% endif %}
                {% endfor %}
            </p>
        `,
        {
            value: 1,
            on: true,
            each: [ 1, 2, 3 ]
        }
    );
    expect( html ).toBe( '<p>1<!--0-->1<!--0-->1<!--0--></p>' );

    component.update( { value: 7 } );
    expect( component.container.innerHTML ).toBe( '<p>7<!--0-->7<!--0-->7<!--0--></p>' );
} );

it( 'if with custom tag', async() => {
    expect.assertions( 3 );
    const { html, component } = await renderComponent(
        compile`
            <div>
                {% if test %}
                    <Tag/>
                {% endif %}
            </div>
        `,
        {
            test: true
        }
    );
    expect( html ).toBe( '<div><div> Custom tag </div><!--0--></div>' );

    component.update( { test: false } );
    expect( component.container.innerHTML ).toBe( '<div></div>' );

    component.update( { test: true } );
    expect( component.container.innerHTML ).toBe( '<div><div> Custom tag </div><!--0--></div>' );
} );

it( 'for with custom tag', async() => {
    expect.assertions( 3 );
    const { component, html } = await renderComponent(
        compile`
            <div>
                {% for array %}
                    <Tag/>
                {% endfor %}
            </div>
        `,
        {
            array: [ 1, 2, 3 ]
        }
    );
    expect( html ).toBe(
        //eslint-disable-next-line max-len
        '<div><div> Custom tag </div><!--0--><div> Custom tag </div><!--0--><div> Custom tag </div><!--0--></div>'
    );

    component.update( { array: [] } );
    expect( component.container.innerHTML ).toBe( '<div></div>' );

    component.update( { array: [ 1, 3 ] } );
    expect( component.container.innerHTML ).toBe(
        '<div><div> Custom tag </div><!--0--><div> Custom tag </div><!--0--></div>'
    );
} );

it( 'update loops in custom tags', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <i>
                <custom-tag-with-loop list={{ list }} foo={{ foo }} bar={{ bar }}/>
            </i>
        `,
        {
            foo: 'foo',
            bar: 'bar',
            list: [ 1, 2, 3 ]
        }
    );
    expect( html ).toBe(
        '<i><em><b class="foobar">1</b><b class="foobar">2</b><b class="foobar">3</b></em></i>'
    );
} );

it( 'should not update variables what exists only in inner scope', async() => {
    expect.assertions( 1 );
    const { html } = await renderComponent(
        compile`
            <p>
                {% if list %}
                    {% for t1 of list %}
                        {% for value of t1 %}
                            <i>{{ value }}</i>
                        {% endfor %}
                    {% endfor %}
                {% endif %}
            </p>
        `,
        {
            list: [ [ 1 ], [ 2 ], [ 3 ] ],
            t1: 'bug?'
        }
    );

    expect( html ).toBe(
        '<p><i>1</i><!--0--><i>2</i><!--0--><i>3</i><!--0--><!--0--></p>'
    );
} );

it( 'should cache options variable data for loops', async() => {
    expect.assertions( 2 );
    const { html, component } = await renderComponent(
        compile`
            <ul>
                {% for code, item of currencies %}
                    {% if code == currency %}
                        <li class="selected">
                            <span>{{ code }}</span>{{ ': ' + item.name }}
                        </li>
                    {% else %}
                        <li>
                            <span>{{ code }}</span>{{ ': ' + item.name }}
                        </li>
                    {% endif %}
                {% endfor %}
            </ul>
        `,
        {
            'currency': 'USD',
            'locale': 'en',
            'currencies': {
                'USD': { 'name': 'US dollar' },
                'EUR': { 'name': 'Euro' },
                'AUD': { 'name': 'Australian dollar' }
            }
        }
    );

    expect( html ).toBe(
        //eslint-disable-next-line max-len
        '<ul><li class="selected"><span>USD</span>: US dollar</li><!--0--><li><span>EUR</span>: Euro</li><!--0--><li><span>AUD</span>: Australian dollar</li><!--0--></ul>'
    );

    const data2 = {
        'currency': 'AUD',
        'locale': 'en',
        'currencies': {
            'USD': { 'name': 'US dollar' },
            'EUR': { 'name': 'Euro' },
            'AUD': { 'name': 'Australian dollar' }
        }
    };

    component.update( data2 );
    expect( component.container.innerHTML ).toBe(
        //eslint-disable-next-line max-len
        '<ul><li><span>USD</span>: US dollar</li><!--0--><li><span>EUR</span>: Euro</li><!--0--><li class="selected"><span>AUD</span>: Australian dollar</li><!--0--></ul>'
    );
} );

it( 'loos should update two levels loops once', async() => {
    expect.assertions( 2 );
    const data = {
        colors: [
            {
                colors: [
                    { color: 'red' },
                    { color: 'green' },
                    { color: 'blue' }
                ]
            },
            {
                colors: [
                    { color: 'red' },
                    { color: 'green' },
                    { color: 'blue' }
                ]
            }
        ],
        color: { color: 'black' }
    };

    const ReLoopMustNotMutateData = await renderComponent(
        compile`
            <ol>
                {% for sub of colors %}
                    {% for color of sub.colors %}
                        <li>
                            {{ color.color }}
                        </li>
                    {% endfor %}
                {% endfor %}
            </ol>
        `,
        data
    );
    expect( ReLoopMustNotMutateData.html ).toBe(
        //eslint-disable-next-line max-len
        '<ol><li>red</li><li>green</li><li>blue</li><!--0--><li>red</li><li>green</li><li>blue</li><!--0--></ol>'
    );

    const ReLoopMustWorkWithSameNameLoops = await renderComponent(
        compile`
            <ol>
                {% for colors %}
                    {% for colors %}
                        <li>
                            {{ color }}
                        </li>
                    {% endfor %}
                {% endfor %}
            </ol>
        `,
        data
    );
    expect( ReLoopMustWorkWithSameNameLoops.html ).toBe(
        //eslint-disable-next-line max-len
        '<ol><li>red</li><li>green</li><li>blue</li><!--0--><li>red</li><li>green</li><li>blue</li><!--0--></ol>'
    );
} );

it( 'loops with cond and outer scope', async() => {
    expect.assertions( 2 );
    const { component, html } = await renderComponent(
        compile`
            <div>
                {% for attr of attributes %}
                    <span>{{attr.name}}</span>
                    <span>{{attr.value}}</span>
                    {% if attr %}
                        <span>{{outer}}</span>
                    {% endif %}
                {% endfor %}
            </div>
        `,
        {
            outer: 'outer',
            attributes: [
                {
                    name: 'name1',
                    value: 'value1'
                },
                {
                    name: 'name2',
                    value: 'value2'
                }
            ]
        }
    );
    expect( html ).toBe(
        //eslint-disable-next-line max-len
        '<div><span>name1</span><span>value1</span><span>outer</span><!--0--><span>name2</span><span>value2</span><span>outer</span><!--0--></div>'
    );
    component.update( {
        outer: 'outer2'
    } );
    expect( component.container.innerHTML ).toBe(
        //eslint-disable-next-line max-len
        '<div><span>name1</span><span>value1</span><span>outer2</span><!--0--><span>name2</span><span>value2</span><span>outer2</span><!--0--></div>'
    );
} );
