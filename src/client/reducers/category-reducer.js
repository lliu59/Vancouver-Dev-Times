import { handleActions } from 'redux-actions';
import {
    addCategory,
    addCategoryResults,
    getAllCategories,
    getAllCategoriesResults,
    deleteCategory,
    deleteCategoriesResults
} from '../actions';

const initialState = {
    newCategory: {},
    categories: []
};

const categoryReducer = handleActions(
    {
        [addCategory]: (state, action) => {
            return {...state}
        },
        [addCategoryResults]: (state, action) => {
            let temp = state.categories;
            temp.push(action.payload.categoryName);
            return {...state, categories: temp}
        },
        [getAllCategories]: (state, action) => {
            return {...state}
        },
        [getAllCategoriesResults]: (state, action) => {
            console.log("getallCatResults;")
            console.log(state)
            console.log(action.payload.allCategories)
            return {...state, categories: action.payload.allCategories}
        }, 
        [deleteCategory]: (state, action) => {
            return {...state}
        },
        [deleteCategoriesResults]: (state, action) => {
            const index = state.categories.indexOf(action.payload.categoryName);
            const allCategories = state.categories;
            if (index > -1) allCategories.splice(index , 1);
            return {...state, categories: allCategories}
        }     
    },
    initialState
)

export default categoryReducer;
