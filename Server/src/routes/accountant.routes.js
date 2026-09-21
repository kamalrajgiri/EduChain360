import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import {
  getDashboard,
  getAlerts,
  getActivity,
  getWeeklyChart,
  getTransactions,
  getInvoices,
  getInvoice,
  updateInvoice,
  bulkInvoiceAction,
  getClasses,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  generateInvoices,
  previewInvoices,
  recordPaymentPartial,
  getReceipt,
  getDaybook,
  searchStudents,
  getStudentDetail,
  getUnpaidInvoices,
  getStudentStatement,
  remindStudent,
  getReports,
  getDayOfWeekReport,
  getAgingReport,
  getRemindersPreview,
  sendFeeReminder,
  getPayrollStaff,
  upsertStaffSalary,
  getPayrollRuns,
  getPayrollRunDetail,
  createPayrollRun,
  getSalarySlip,
    getAdjustments,
  createAdjustment,
  deleteAdjustment,
  confirmReceipt
} from '../controllers/accountant.controller.js';

const router = Router();

router.use(authenticate, requireRole('Accountant'));

// Dashboard
router.get('/dashboard',                        getDashboard);
router.get('/dashboard/alerts',                 getAlerts);
router.get('/dashboard/activity',               getActivity);
router.get('/dashboard/weekly',                 getWeeklyChart);

// Daybook
router.get('/daybook',                          getDaybook);

// Transactions & receipts
router.get('/transactions',                     getTransactions);
router.get('/receipts/:id',                     getReceipt);
router.post('/receipts/:id/confirm',            confirmReceipt);

// Invoices
router.get('/invoices',                         getInvoices);
router.get('/invoices/:id',                     getInvoice);
router.patch('/invoices/:id',                   updateInvoice);
router.post('/invoices/bulk',                   bulkInvoiceAction);

// Classes
router.get('/classes',                          getClasses);

// Fee structure
router.get('/fee-structure',                    getFeeStructure);
router.post('/fee-structure',                   createFeeStructure);
router.patch('/fee-structure/:id',              updateFeeStructure);
router.delete('/fee-structure/:id',             deleteFeeStructure);
router.post('/fee-structure/preview-invoices',  previewInvoices);
router.post('/fee-structure/generate-invoices', generateInvoices);

// Payments
router.post('/payments',                        recordPaymentPartial);

// Students
router.get('/students',                         searchStudents);
router.get('/students/:id',                     getStudentDetail);
router.get('/students/:id/unpaid',              getUnpaidInvoices);
router.get('/students/:id/statement',           getStudentStatement);
router.post('/students/:id/remind',             remindStudent);
router.get('/students/:id/adjustments',       getAdjustments);
router.post('/adjustments',                    createAdjustment);
router.delete('/adjustments/:id',              deleteAdjustment);

// Reports
router.get('/reports',                          getReports);
router.get('/reports/aging',                    getAgingReport);
router.get('/reports/day-of-week',              getDayOfWeekReport);
// Reminders
router.get('/reminders/preview',                getRemindersPreview);
router.post('/reminders/send',                  sendFeeReminder);

// Payroll
router.get('/payroll/staff',                    getPayrollStaff);
router.post('/payroll/staff/:userId',           upsertStaffSalary);
router.get('/payroll/runs',                     getPayrollRuns);
router.get('/payroll/runs/:id',                 getPayrollRunDetail);
router.post('/payroll/runs',                    createPayrollRun);
router.get('/payroll/runs/:runId/slip/:userId', getSalarySlip);

export default router;