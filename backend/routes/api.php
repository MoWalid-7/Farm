<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BackupController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CycleController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\InventoryItemController;
use App\Http\Controllers\Api\V1\InventoryTransactionController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RevenueController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\WeightController;
use App\Http\Controllers\Api\V1\WorkerController;
use App\Http\Controllers\Api\V1\WorkerPaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/search', SearchController::class);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/backups', [BackupController::class, 'index']);
        Route::post('/backups', [BackupController::class, 'store']);
        Route::post('/backups/restore', [BackupController::class, 'uploadRestore']);
        Route::get('/backups/{backup}/download', [BackupController::class, 'download']);
        Route::post('/backups/{backup}/restore', [BackupController::class, 'restore']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
        Route::apiResource('workers', WorkerController::class);
        Route::apiResource('expenses', ExpenseController::class);
        Route::apiResource('revenues', RevenueController::class);
        Route::apiResource('worker-payments', WorkerPaymentController::class)
            ->parameters(['worker-payments' => 'workerPayment']);
        Route::apiResource('cycles', CycleController::class);
        Route::apiResource('weights', WeightController::class);
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('sales', SaleController::class);
        Route::apiResource('suppliers', SupplierController::class);
        Route::get('/inventory-items/low-stock', [InventoryItemController::class, 'lowStock']);
        Route::post('/inventory-items/{inventoryItem}/adjust', [InventoryTransactionController::class, 'adjust']);
        Route::apiResource('inventory-items', InventoryItemController::class)->parameters(['inventory-items' => 'inventoryItem']);
        Route::apiResource('inventory-transactions', InventoryTransactionController::class)->parameters(['inventory-transactions' => 'inventoryTransaction']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/financial-summary', [DashboardController::class, 'summary']);
        Route::get('/reports/financial', [ReportController::class, 'financial']);
        Route::get('/reports/financial/{period}', [ReportController::class, 'financial'])
            ->whereIn('period', ['daily', 'weekly', 'monthly', 'custom']);
        Route::get('/reports/financial/export', [ReportController::class, 'financialExport']);
        Route::get('/reports/financial/{period}/export', [ReportController::class, 'financialExport'])
            ->whereIn('period', ['daily', 'weekly', 'monthly', 'custom']);
        Route::get('/reports/financial/print', [ReportController::class, 'financialPrint']);
        Route::get('/reports/financial/{period}/print', [ReportController::class, 'financialPrint'])
            ->whereIn('period', ['daily', 'weekly', 'monthly', 'custom']);
        Route::get('/reports/{period}', [ReportController::class, 'financial'])
            ->whereIn('period', ['daily', 'weekly', 'monthly', 'custom']);
        Route::get('/reports/cycles', [ReportController::class, 'cycles']);
        Route::get('/reports/cycles/export', [ReportController::class, 'cyclesExport']);
        Route::get('/reports/cycles/print', [ReportController::class, 'cyclesPrint']);
    });

    Route::get('/health', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => 'Farm API is healthy',
            'timestamp' => now()->toISOString(),
        ]);
    });
});
