import {connect} from "react-redux";
// react
import React from 'react';
import SuRE from "./SuRE";

const SuREDev = ( props ) => {
    const {loading_finished, fetched_data} = props

    return (loading_finished &&
        <SuRE text_rules={fetched_data.text_rules}
              columns={fetched_data.columns} lattice={fetched_data.lattice}
              filter_threshold={fetched_data.filter_threshold}
              rules = {fetched_data.rules}
              real_min = {fetched_data.real_min}
              real_max = {fetched_data.real_max}
              y_gt = {fetched_data.y_gt}
              y_pred = {fetched_data.y_pred}
              target_names = {fetched_data.target_names}
              preIndex = {fetched_data.lattice_preIndex}
        />
    );
}
function mapStateToProps(state) {
    return {
        fetched_data: state.fetched_data,
        loading_finished: state.loading_finished,
    };
}

export default connect(mapStateToProps)(SuREDev);