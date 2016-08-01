import { SET_SEARCHVALUE } from '../actions/actionCreator';

export default function (state = null, action) {
  switch (action.type) {
    case SET_SEARCHVALUE:
      return action.payload;
  }
  return state;
}
