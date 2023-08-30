// react
import React, { useState } from 'react';

// styles
import './TextList.css'
import {postData, readable_text, transform_selected_rule} from "../../utils/utils";

const TextList = ( {rules, attrs, lattice, target_names, on_rule_explore, env, r2lattice, data_value} ) => {
    const explore_rule = (rid, cid) => {
        const node_id = r2lattice[rid][cid]
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

    const render_text_rules = () => {
        let rule_list = [];

        rules.forEach((rule, i) => {
            let r = "IF ";

            rule['rules'].forEach((cond, i) => {
                r += `${i > 0 ? ' AND ' : ""} ${attrs[cond['feature']]} `;
                if (cond['sign'] === 'range'){
                    r += `in between [${readable_text(cond['threshold0'])}, ${readable_text(cond['threshold1'])})`
                } else {
                    r += `${cond['sign']} ${readable_text(cond['threshold'])}`
                }
            })
            r += ` THEN ${target_names[rule['label']]}.`
            rule_list.push(<p onClick={() => explore_rule(i, rule['rules'].length-1)}>R{i+1}. {r}</p>)
        })
        return rule_list;
    }
    return <div>
        {render_text_rules()}
    </div>
}

export default TextList;