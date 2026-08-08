import { createSlice } from '@reduxjs/toolkit';

// TODO: build this out — thunks for list/create/update/delete users, pagination, filters, etc.
// apiClient is already wired with auth headers + token refresh, just import it:
// import { apiClient } from '../../lib/apiClient';

interface UsersState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: UsersState = {
  status: 'idle',
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
});

export default usersSlice.reducer;
