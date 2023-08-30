import React, {useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { select } from 'd3-selection'
import SuRE from './SuRE';

import QueryProcessor from "./component/QueryProcessor/QueryProcessor";
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SelectReducer from './reducer/reducer.js';
import SuREDev from "./SuREDev";


const store = createStore(SelectReducer);

const root = <Provider store={store}>
       <div>
           <QueryProcessor/>
           <SuREDev />
       </div>
</Provider>;
// ReactDOM.render(root, document.getElementById('root'));


export function renderSuRE(divName, fetched_data){
    ReactDOM.render(
        <Provider store={store}>
            <SuRE
                text_rules={fetched_data.text_rules}
                columns={fetched_data.columns} lattice={fetched_data.lattice}
                filter_threshold={fetched_data.filter_threshold}
                rules = {fetched_data.rules}
                real_min = {fetched_data.real_min}
                real_max = {fetched_data.real_max}
                y_gt = {fetched_data.y_gt}
                y_pred = {fetched_data.y_pred}
                data = {fetched_data.data}
                target_names = {fetched_data.target_names}
                preIndex = {fetched_data.lattice_preIndex}
            />
        </Provider>,
        select(divName).node() );
}