// react
import React, { useState } from 'react';

// styles

// hooks
import { renderD3 } from '../../hooks/render.hook';

// const
import {postData, readable_text, transform_selected_rule} from "../../utils/utils";

// third-party
import * as d3 from 'd3';
import {colorCate} from "../../utils/const";
import {set_selected_rule} from "../../reducer/action";

const HierarchicalTable = ( props ) => {
    const {attrs, filter_threshold, lattice, rules, preIndex,
        tot_size, target_names, data_value, col_order, col_info, show_err_checked
    } = props;

    const legend_height = 20,
        rectMarginTop = 5,
        rectMarginBottom = 5,
        glyphCellHeight = 10,
        sqWidth = 10,
        cellWidth = 80,
        feat_name_height = 30,
        root_indent = 20,
        line_indent = 100;

    const width = 900;
    const height = 500;

    const clear_plot = (svgref) => {
        svgref.selectAll('*').remove();
    }

    // TODO: create feature order by each subgroup of rules
    const generate_feature_header = () => {

    }

    const render_plot_header = (svg, chartGroup, yScale, x_offset) => {
        // render feature names
        let max_x = 0
        let column = chartGroup.append('g')
            .attr('class', 'attr_name')
            .selectAll(".column").data(attrs)
            .enter().append("g")
            .attr("class", `column`)
            .attr('id', (d,i)=>`col-${i}`)
            .attr("transform", function(d, i) {
                if (col_info[col_order[i]].freq > 0) {
                    max_x = d3.max([max_x, col_order[i]*cellWidth+10])
                }
                return `translate(${col_order[i]*cellWidth+10}, ${yScale(0)})rotate(330)`;
            });

        column.append("text")
            .attr("y", yScale.bandwidth() / 1.5 - 5)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .text((d,i) => {
                if (col_info[col_order[i]].freq === 0) return "";
                let text = d;
                if (d.length > 10) {
                    text = text.slice(0, 10)+'...';
                }
                return text;
            })
            .append('title')
            .text(d => d);
        svg.attr('width', x_offset + max_x + cellWidth);
    }

    const explore_rule = (node_id) => {
        const {on_rule_explore, env} = props;
        const currentRule = transform_selected_rule(lattice, node_id);

        if (env === 'notebook') {
            on_rule_explore(currentRule);
        } else {
            const para = {
                'dataname': data_value,
                'rule': currentRule,
            }
            postData("explore_rule/", JSON.stringify(para), (res) => {
                on_rule_explore(res);
            } )
        }
    }

    const render_hierarchical_table = (svg, chartGroup, summary_size_) => {
        const canvas = document.getElementById('canvas4text');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px sans-serif';

        let hlist = lattice;

        let list_height = (1+Object.keys(hlist).length) * (glyphCellHeight + rectMarginTop + rectMarginBottom),
            yPos = d3.scaleLinear()
                .domain([0, Object.keys(hlist).length])
                .range([10, list_height]),
            unit_height = glyphCellHeight;

        let list_svg = chartGroup;

        let max_depth = d3.max(Object.keys(hlist), key => hlist[key].depth),
            unit_width = 30,
            // list_width = unit_width * (max_depth),
            list_width = line_indent,
            xPos = d3.scaleLinear()
                .domain([0, max_depth+1])
                .range([root_indent, list_width*0.7]);

        // caclculate yoffset
        let y_offset = {}, count = 0;
        let ordered_node = {};
        for (let i = 1; i < Object.keys(hlist).length; i++) {
            ordered_node[preIndex[i]] = i;
        }
        for (let i = 0; i < Object.keys(hlist).length-1; i++) {
            if (hlist[ordered_node[i]].depth === 0) count++;
            y_offset[ordered_node[i]] = count * unit_height;
        }

        // render
        let text_width = d3.max(attrs, function(d) {return ctx.measureText(d).width});
        text_width += d3.max(target_names, function(d) {return ctx.measureText(d).width});
        text_width += ctx.measureText("AND THEN ").width;

        let bar_width = 0;

        list_svg.attr('height', list_height + count * unit_height)
        svg.attr('height', list_height + count * unit_height);

        // rule content
        let rule_g = list_svg.selectAll(".rule_node")
            .data(d3.range(1, Object.keys(hlist).length).map(function(k) {
                return hlist[k];
            }))
            .enter().append('g')
            .attr('id', (d) => `hlist_content-${d.node_id}`)
            .attr("class", "rule_node")
            .attr('width', `${unit_width}px`)
        // .attr("transform", function(d, i) {
        //     return `translate(${xPos(d.depth)+1}, ${yPos(preIndex[d.node_id])+y_offset[d.node_id]})`
        // });

        // add confusion matrix bar
        rule_g.append('g')
            .attr('transform', d => `translate(${line_indent}, ${yPos(preIndex[d.node_id])+y_offset[d.node_id]})`)
            // .attr('transform', d => `translate(${d.text_width})`)
            .selectAll('.hlist_conf_mat')
            .data((d) => {
                // let cid=d['cid'],
                // node_id = r2lattice[d['rid']][cid];
                let node_id = d['node_id'];

                let tot = lattice[node_id]['support'],
                    size = summary_size_(tot) * 2,
                    x_offset = 0,
                    conf_mat = [];

                bar_width = d3.max([bar_width, size]);

                target_names.forEach((d, i) => {
                    conf_mat.push({
                        'name': `false-${d}`,
                        'id': node_id,
                        'x': x_offset,
                        'width': size*lattice[node_id]['conf_mat'][i][1]/tot,
                    });
                    x_offset += size*lattice[node_id]['conf_mat'][i][1]/tot;
                    conf_mat.push({
                        'name': `true-${d}`,
                        'id': node_id,
                        'x': x_offset,
                        'width': size*lattice[node_id]['conf_mat'][i][0]/tot,
                    });
                    x_offset += size*lattice[node_id]['conf_mat'][i][0]/tot;
                })

                return conf_mat;
            }).enter()
            .append('rect')
            .attr('class', 'hlist_conf_mat')
            .attr('x', d => d.x)
            .attr('y', -unit_height/2-rectMarginTop)
            .attr('width', d => d.width)
            .attr('height', unit_height)
            .attr('fill', (d, i) => {
                return i % 2===0 && show_err_checked ? `url(#false-class-${i/2})` : colorCate[Math.floor(i/2)]
            });


        // condition content
        bar_width += 10 + line_indent;
        rule_g.append('g')
            .attr("class", "rule_item")
            // .attr("transform", d => `translate(${summary_size_(lattice[d['node_id']]['support']) * 3 + 5})`)
            .attr("transform", function(d, i) {
                return `translate(${bar_width}, ${yPos(preIndex[d.node_id])+y_offset[d.node_id]})`
            })
            .selectAll("condition_item")
            .data(d => {
                let row_conditions = [], node_id = d['node_id'];

                while (node_id > 0) {
                    let content = "", node = hlist[node_id];
                    if (node['sign'] !== 'range') {
                        if (node['sign'] === '<=') {
                            content += ' < ' ;
                        } else {
                            content += ' >= ';
                        }
                        content += readable_text(node['threshold']) + " ";
                    } else {
                        content += "[" + readable_text(node['threshold0']) + ", " + readable_text(node['threshold1']) + ")";
                    }
                    row_conditions.push({"x": col_order[node['feature']]*cellWidth, "content": content});
                    node_id = node['parent'];
                }

                return row_conditions;
            }).enter()
            .append('text')
            .attr("class", "condition_item")
            .text(d => d.content)
            .attr("x", d=>d.x);

        rule_g
            .append('rect')
            .attr('class', 'node_mask')
            .attr('id', d =>`rulemask-${d['node_id']}`)
            .attr('x', d=>xPos(d.depth)+1+bar_width)
            .attr('y', d=>-unit_height/2-rectMarginTop-2+yPos(preIndex[d.node_id])+y_offset[d.node_id])
            .attr('width', d=>d['text_width']+2)
            .attr('height', unit_height+6)
            .on('click', (evt, d) => {
                explore_rule(d['node_id'])
            })


        // subgroup lines
        let dividers = [], right_border = 0;
        for (let i = 1; i < Object.keys(hlist).length; i++) {
            if (hlist[i]['children_id'].length === 0) {
                dividers.push(hlist[i]['node_id'])
            }
        }
        for (let i = 0; i < col_info.length; i++) {
            if (col_info[i].freq > 0) {
                right_border = i+1;
            }else break;
        }
        right_border = right_border * cellWidth + line_indent;

        let rule_dividers = list_svg.append('g')
            .attr('class', 'subgroup_divider')

        rule_dividers.selectAll('.rule_divider')
            .data(dividers).enter()
            .append('line')
            .attr('class', 'rule_divider')
            .attr('x1', line_indent)
            .attr('x2', right_border)
            .attr('y1', d => yPos(preIndex[d])+y_offset[d] + 5)
            .attr('y2', d => yPos(preIndex[d])+y_offset[d] + 5)
            .attr('stroke', 'lightgrey')

        // hierarchical lines
        let links = [], initial_circles = [];
        for (let i = 1; i < Object.keys(hlist).length; i++) {

            if (hlist[i]['children_id'].length > 0) {
                for (let j = 0; j < hlist[i]['children_id'].length; j++){
                    links.push({
                        'source': i,
                        'target': hlist[i]['children_id'][j]
                    })
                }
            }
            if (hlist[i]['parent'] === 0) {
                links.push({
                    'source': 0,
                    'target': i
                });
                initial_circles.push(i);
            }
        }

        let list_links = list_svg.append('g')
            .attr('class', 'list_links')

        let line = d3.line()
            .x(d=>d.x)
            .y(d=>d.y);

        list_links.selectAll('.list_link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'list_link')
            .attr('id', d => `hlist-link-${d['source']}-${d['target']}`)
            .attr("d", d => {
                let arr = [];
                if (d.source === 0) {
                    arr = [
                        {'x': xPos(hlist[d.target].depth)-root_indent,
                            'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                        {'x': list_width-2,
                            'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                    ]
                } else {
                    arr = [
                        {'x': xPos(hlist[d.source].depth), 'y': yPos(preIndex[hlist[d.source].node_id])+y_offset[d.source]-5},
                        {'x': xPos(hlist[d.source].depth), 'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                        {'x': list_width-2, 'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                    ];
                }
                return line(arr);
            })
            .attr('stroke', 'darkgrey')
            .attr('fill', "none");
        list_links.selectAll('.list_initial_circle')
            .data(initial_circles)
            .enter()
            .append('circle')
            .attr('class', 'list_initial_circle')
            .attr("cx", d => xPos(hlist[d].depth)-root_indent)
            .attr("cy", d => yPos(preIndex[hlist[d].node_id])+y_offset[d]-5)
            .attr('r', 2)
    }

    const ref = renderD3(
        (svgref) => {

            // clearing
            clear_plot(svgref);

            // constants
            const margin = {
                top: 5,
                left: 20,
                right: 20,
                bottom: 20
            };
            // svg size
            const svgWidthRange = [0, svgref.node().getBoundingClientRect().width - margin.left - margin.right];
            const svgHeightRange = [0, svgref.node().getBoundingClientRect().height - margin.top - margin.bottom];

            // creating scales
            const yScale = d3.scaleBand().domain(d3.range(rules.length+1))
                .range(svgHeightRange);
            const sizeScale = d3.scaleLinear()
                .domain([filter_threshold['support'] , tot_size])
                .range([5, 35]);
            let rectXst = [];
            d3.range(filter_threshold['num_bin']).forEach(d => {
                rectXst.push(d * sqWidth)
            });

            // creating groups
            const x_offset = margin.left + line_indent+ 10+ sizeScale.range()[1];
            const headerGroup = svgref
                .append("g")
                .attr("transform", `translate(${x_offset},
                    ${margin.top+feat_name_height})`);
            const chartGroup = svgref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top+feat_name_height})`);

            // render header
            render_plot_header(svgref, headerGroup, yScale, x_offset);

            // creating feature aligned table
            render_hierarchical_table(svgref, chartGroup, sizeScale);
        }
    )

    return  <div className='hierarchical-list-wrapper' >
        <div className='hierarchical-list-container' style={{maxHeight: height, maxWidth: width, overflow: 'auto'}}>
            <svg ref={ref}></svg>
        </div>
    </div>;
}

export default HierarchicalTable;