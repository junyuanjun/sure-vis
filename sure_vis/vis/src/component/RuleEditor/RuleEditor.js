import React, {useEffect, useState} from "react";

import {connect} from "react-redux";
import {Grid, IconButton, TextField, Divider} from "@mui/material";
import {renderD3} from "../../hooks/render.hook";
import * as d3 from "d3";
import sync_icon from '../sync.png';

import './RuleEditor.css';
import {bindActionCreators} from "redux";
import * as actions from "../../reducer/action";
import {colorCate} from "../../utils/const";
import {postData} from "../../utils/utils";


const RuleEditor = ( props ) => {
    const {attrs, filter_threshold, tot_size, set_selected_rule, selected_rule, data_value} = props;

    const [ currentRule, setCurrentRule ] = useState( selected_rule );
    useEffect(() => {
        setCurrentRule(selected_rule);
    }, [selected_rule])


    const ConditionEditor = ({condition, index}) => {
        const [value, setValue] = useState(condition['sign']+condition['threshold']);

        const handleChange = (event, newValue) => {
            setValue(newValue);
        };

        return <Grid direction="column" className="centerCol">
            <Grid direction="row" className="conditionRow" >
                        <span className="featureName">
                            {attrs[condition['feature']]}
                        </span>
                <TextField className='conditionText' value={value}
                           onChange={handleChange}
                           id={`condition-text-${index}`}/>
            </Grid>
        </Grid>
    }

    const max_r = 15,
        glyphCellHeight = 20,
        legend_height = 20,
        rectMarginTop = 5,
        rectMarginBottom = 5;

    const clear_plot = (ref) => {
        ref.selectAll('*').remove();
    }

    const render_condition_result = (svg, yScale, sizeScale) => {
        let confusion_groups = svg.selectAll('conf_mat')
            .data(currentRule)
            .join('g')
            .attr('transform', (d, i) => `translate(0, ${yScale(i)})`)
            .attr('class','conf_mat')

        confusion_groups.selectAll('rect')
            .data(stat => {
                let tot = tot_size,
                    x_offset = 0,
                    conf_mat = [];

                stat['conf_matrix'].forEach((d, i) => {
                    conf_mat.push({
                        'x': x_offset,
                        'name': `false-${i}`,
                        'width': sizeScale(d[0]),
                    });
                    x_offset += sizeScale(d[0]);
                    conf_mat.push({
                        'x': x_offset,
                        'name': `true-${i}`,
                        'width': sizeScale(d[1]),
                    });
                    x_offset += sizeScale(d[1]);
                })

                return conf_mat;
            })
            .join('rect')
            .attr('x', d=>d.x)
            .attr('y', -glyphCellHeight/2)
            .attr('height', glyphCellHeight)
            .attr('width', d => d.width)
            .attr('fill', (d, i) => i%2===0 ? `url(#false-class-${i/2})` : colorCate[Math.floor(i/2)]);
    }


    const ref =  renderD3(
        (svg_ref) => {
            clear_plot(svg_ref);

            // constants
            const margin = {
                top: 5,
                left: 0,
                right: 20,
                bottom: 20
            };

            const chartGroup = svg_ref
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top+legend_height})`);

            // svg size
            const svgWidthRange = [0, svg_ref.node().getBoundingClientRect().width - margin.left - margin.right];
            const svgHeightRange = [0, svg_ref.node().getBoundingClientRect().height - margin.top - margin.bottom];

            svg_ref.attr('width', svgWidthRange[1])
                .attr('height', 70 * currentRule.length);

            // creating scales
            const yScale = d3.scaleBand().domain(d3.range(currentRule.length))
                .range([0, 70 * currentRule.length]);

            const sizeScale = d3.scaleLinear()
                .domain([filter_threshold['support'] , tot_size])
                .range([5, 70]);

            render_condition_result(chartGroup, yScale, sizeScale);
        })

    const split_sign_value = (cond_str) => {
        let num_pos = 0;
        for (let i = 0; i < cond_str.length; i++) {
            if (cond_str[i]>='1' && cond_str[i]<='9') {
                num_pos = i;
                break;
            }
        }
        // TODO: Error Input Control
        // process sign
        let sign_start = 0, sign_end = num_pos-1;
        while (sign_start === ' ') sign_start++;
        while (sign_end === ' ') sign_end--;

        // process num

        return [cond_str.substring(sign_start, sign_end+1), +cond_str.substring(num_pos)];
    }

    const sync_condition = () => {
        const {on_rule_explore, env} = props;
        let rule = [];

        currentRule.forEach((item, i) => {
            const [sign, val] = split_sign_value(document.getElementById(`condition-text-${i}`).value)
            rule.push({
                'feature': item['condition']['feature'],
                'sign': sign,
                'threshold': val,
            })
        })

        if (env === 'notebook') {
            on_rule_explore(rule);
        } else {
            const para = {
                'dataname': data_value,
                'rule': rule,
            }
            postData("explore_rule/", JSON.stringify(para), (res) => {
                on_rule_explore(res);
            });
        }
    }

    const render_editable_condition = () => {
        let cond_list = [];

        currentRule.forEach((item, ix) => {
            cond_list.push(<ConditionEditor index={ix} condition={item['condition']}/>)
        })

        return cond_list;
    }

    return <Grid container direction="row" xs={12} style={{justifyContent: 'flex-start'}}>
            <Grid  className="editing-area" direction="column" style={{justifyContent: "flex-end"}}>
                <Grid direction="row" className='title'>
                    <p style={{display: "inline"}}>Rule(Conditions) for Inspection </p>
                    <IconButton onClick={sync_condition}>
                        <img src={sync_icon} className='icon'/>
                    </IconButton>
                </Grid>
                {render_editable_condition()}
            </Grid>
            <Divider orientation='vertical' flexItem/>
            <Grid  className="distribution-area title">
                <p  style={{marginLeft: 20}}>Data Distribution</p>
                <svg ref={ref}></svg>
            </Grid>
        </Grid>
}

function mapStateToProps(state) {
    return {
        selected_rule: state.selected_rule,
        data_value: state.data_value,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(RuleEditor);