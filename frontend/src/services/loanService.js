import api from './api';

const getLoans = () => api.get('/loans');
const addLoan = (data) => api.post('/loans', data);
const deleteLoan = (id) => api.delete(`/loans/${id}`);
const getAmortization = (id) => api.get(`/loans/${id}/amortization`);
const simulate = (id, extra) => api.post(`/loans/${id}/simulate?extraPayment=${extra}`);
const getSuggestions = () => api.get('/loans/suggestions');

const loanService = { getLoans, addLoan, deleteLoan, getAmortization, simulate, getSuggestions };
export default loanService;