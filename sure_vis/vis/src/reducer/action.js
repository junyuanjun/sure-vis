import * as type from './const.js';

function makeActionCreator(type, ...argNames) {
    return function (...args) {
        let action = { type }
        argNames.forEach((arg, index) => {
            action[argNames[index]] = args[index]
        })
        return action
    }
}

export const data_select = makeActionCreator(type.SELECT_DATA, 'value');

export const loading_finished = makeActionCreator(type.LOADING_FINISHED, "value");
export const fetch_data = makeActionCreator(type.FETCH_DATA, "value");

export const set_selected_rule = makeActionCreator(type.SET_SELECTED_RULE, 'value');