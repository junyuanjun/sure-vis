import * as type from './const.js';
import * as vals from '../utils/const.js';

const initial_state = {
    /*Feature Selection Part States */
    // data set value
    data_value: vals.default_data,

    // back-end segmentation finished mark
    loading_finished: false,

    /* Data Fetched */
    fetched_data: {},

    selected_rule: [],
    rule_suggestions: [],
}

export default function Reducer(state = initial_state, action) {
    switch(action.type) {
        case type.LOADING_FINISHED:
            return Object.assign({}, state, {
                loading_finished: action.value,
            });
        case type.FETCH_DATA:
            return Object.assign({}, state, {
                fetched_data: action.value,
            });
        case type.SET_SELECTED_RULE:
            return Object.assign({}, state, {
                selected_rule: action.value,
            });
    }
    return state;
}