// react
import React, { useState } from 'react';

// styles
import './HierarchicalList.css'

// hooks
import { renderD3 } from '../../hooks/render.hook';

// const
import {postData, readable_text, transform_selected_rule} from "../../utils/utils";

// third-party
import * as d3 from 'd3';
import {colorCate, conf_fill} from "../../utils/const";
import {set_selected_rule} from "../../reducer/action";

const HierarchicalList = ( props ) => {
    const {attrs, filter_threshold, lattice, rules, preIndex,
        tot_size, target_names, data_value, show_err_checked
    } = props;

    const max_r = 15,
        glyphCellHeight = 10,
        legend_height = 20,
        rectMarginTop = 5,
        rectMarginBottom = 5,
        sqWidth = glyphCellHeight;
    const width = 900;
    const height = 500;

    const clear_plot = (svgref) => {
        svgref.selectAll('*').remove();
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

    const render_hierarchical_list = (svg, chartGroup, summary_size_) => {
        const canvas = document.getElementById('canvas4text');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px sans-serif';

        let hlist = lattice;

        let list_height = (1+Object.keys(hlist).length) * (glyphCellHeight + rectMarginTop + rectMarginBottom),
            yPos = d3.scaleLinear()
                .domain([0, Object.keys(hlist).length])
                .range([10, list_height]),
            unit_height = glyphCellHeight;

        let list_svg = chartGroup.attr('transform', `translate(10, 0)`);

        let max_depth = d3.max(Object.keys(hlist), key => hlist[key].depth),
            unit_width = 30,
            list_width = unit_width * (1+max_depth),
            xPos = d3.scaleLinear()
                .domain([0, max_depth+1])
                .range([0, list_width]);

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

        list_svg.attr('width', `${list_width+text_width+summary_size_.range()[1]*3}`)
            .attr('height', list_height + count * unit_height)
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
            .attr('transform', d => `translate(0, ${yPos(preIndex[d.node_id])+y_offset[d.node_id]})`)
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
            .attr('fill', (d, i) => i % 2===0 && show_err_checked ? `url(#false-class-${i/2})` : colorCate[Math.floor(i/2)]);


        // condition content
        bar_width += 10;
        rule_g.append('g')
            .attr("class", "rule_item")
            // .attr("transform", d => `translate(${summary_size_(lattice[d['node_id']]['support']) * 3 + 5})`)
            .attr("transform", function(d, i) {
                return `translate(${xPos(d.depth)+1+bar_width}, ${yPos(preIndex[d.node_id])+y_offset[d.node_id]})`
            })
            .selectAll("condition_item")
            .data(d => {
                let content = attrs[d["feature"]];
                if (d['sign'] !== 'range') {
                    if (d['sign'] === '<=') {
                        content += ' < ' ;
                    } else {
                        content += ' >= ';
                    }
                    content += readable_text(d['threshold']) + " ";
                } else {
                    content += " from " + readable_text(d['threshold0']) + " to " + readable_text(d['threshold1']) + " ";
                }

                let conj = "AND ";

                if (d.depth === 0) {
                    conj = "IF "
                }

                d['text_width'] = ctx.measureText(content).width + ctx.measureText(conj).width;

                return [{"x": 0, "content": conj}, {"x": ctx.measureText(conj).width, "content": content}];
            }).enter()
            .append('text')
            .attr("class", "condition_item")
            .text(d => d.content)
            .attr("x", d=>d.x)
            .style("font-weight", (d, i) => i%2 === 0 ? "bold" : "normal");

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


        // condition links
        let links = [];
        for (let i = 1; i < Object.keys(hlist).length; i++) {
            if (hlist[i]['children_id'].length > 0) {
                for (let j = 0; j < hlist[i]['children_id'].length; j++){
                    links.push({
                        'source': i,
                        'target': hlist[i]['children_id'][j]
                    })
                }
            }
        }

        let list_links = list_svg.append('g')
            .attr('class', 'list_links')

        let line = d3.line()
            .x(d=>d.x)
            .y(d=>d.y);

        let link_lines = list_links.selectAll('.list_link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'list_link')
            .attr("transform", `translate(${bar_width})`)
            .attr('id', d => `hlist-link-${d['source']}-${d['target']}`)
            .attr("d", d => {
                let arr = [
                    {'x': xPos(hlist[d.source].depth)+7, 'y': yPos(preIndex[hlist[d.source].node_id])+y_offset[d.source]},
                    {'x': xPos(hlist[d.source].depth)+7, 'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                    {'x': xPos(hlist[d.target].depth), 'y': yPos(preIndex[hlist[d.target].node_id])+y_offset[d.target]-5},
                ];
                return line(arr);
            })
            .attr('stroke', 'darkgrey')
            .attr('fill', "none");
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

            const headerGroup = svgref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            const chartGroup = svgref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top+legend_height})`);

            // svg size
            const svgWidthRange = [0, svgref.node().getBoundingClientRect().width - margin.left - margin.right];
            const svgHeightRange = [0, svgref.node().getBoundingClientRect().height - margin.top - margin.bottom];

            const min_support = filter_threshold['support'] / tot_size;

            svgref.attr('width', width);

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

            // creating feature aligned tree
            render_hierarchical_list(svgref, chartGroup, sizeScale);
        }
    )

    return  <div className='hierarchical-list-wrapper'>
        <div className='hierarchical-list-container' style={{maxHeight: height, maxWidth: width, overflow: 'auto'}}>
            <svg ref={ref}></svg>
        </div>
    </div>;
}

export default HierarchicalList;