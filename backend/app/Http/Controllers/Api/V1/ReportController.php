<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportRequest;
use App\Services\ReportService;

class ReportController extends Controller
{
    public function financial(ReportRequest $request, ReportService $service, ?string $period = null)
    {
        $period = $period ?: $request->input('period', 'custom');
        $from = $request->date('from') ?: $request->date('date');
        $to = $request->date('to');

        return response()->json(['success' => true, 'data' => $service->financial($period, $from, $to)]);
    }

    public function cycles(ReportRequest $request, ReportService $service)
    {
        return response()->json(['success' => true, 'data' => $service->cycles(
            $request->date('from'), $request->date('to'), $request->integer('cycle_id') ?: null
        )]);
    }

    public function financialExport(ReportRequest $request, ReportService $service, ?string $period = null)
    {
        $period = $period ?: $request->input('period', 'custom');
        $report = $service->financial($period, $request->date('from') ?: $request->date('date'), $request->date('to'));

        return $this->csvDownload('financial-report.csv', ['الفترة', 'من', 'إلى', 'الإيرادات', 'المصروفات', 'مدفوعات العمال', 'إجمالي التكاليف', 'صافي الربح'], function () use ($report) {
            foreach ($report['breakdown'] as $row) {
                yield [$row['label'], $row['from'], $row['to'], $row['summary']['total_revenues'], $row['summary']['total_expenses'], $row['summary']['total_worker_payments'], $row['summary']['total_costs'], $row['summary']['net_profit']];
            }
        });
    }

    public function cyclesExport(ReportRequest $request, ReportService $service)
    {
        $cycles = $service->cycles($request->date('from'), $request->date('to'), $request->integer('cycle_id') ?: null);

        return $this->csvDownload('cycles-report.csv', ['المعرف', 'اسم الدورة', 'الحالة', 'تاريخ البدء', 'تاريخ الانتهاء', 'عدد الطيور', 'إجمالي الوزن', 'متوسط الوزن', 'كمية المبيعات', 'إجمالي المبيعات', 'المبيعات المحصلة', 'المبيعات المتبقية'], function () use ($cycles) {
            foreach ($cycles as $cycle) {
                yield [$cycle['id'], $cycle['name'], $cycle['status'], $cycle['start_date'], $cycle['end_date'], $cycle['bird_count'], $cycle['total_weight'], $cycle['average_weight'], $cycle['sale_quantity'], $cycle['total_sales'], $cycle['paid_sales'], $cycle['remaining_sales']];
            }
        });
    }

    public function financialPrint(ReportRequest $request, ReportService $service, ?string $period = null)
    {
        $period = $period ?: $request->input('period', 'custom');
        $report = $service->financial($period, $request->date('from') ?: $request->date('date'), $request->date('to'));
        $rows = '';
        foreach ($report['breakdown'] as $row) {
            $rows .= '<tr><td>'.e($row['label']).'</td><td>'.e($row['summary']['total_revenues']).'</td><td>'.e($row['summary']['total_expenses']).'</td><td>'.e($row['summary']['net_profit']).'</td></tr>';
        }

        return response('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>التقرير المالي</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:8px;text-align:right}</style></head><body><h1>التقرير المالي</h1><table><thead><tr><th>الفترة</th><th>الإيرادات</th><th>المصروفات</th><th>صافي الربح</th></tr></thead><tbody>'.$rows.'</tbody></table></body></html>', 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function cyclesPrint(ReportRequest $request, ReportService $service)
    {
        $rows = '';
        foreach ($service->cycles($request->date('from'), $request->date('to'), $request->integer('cycle_id') ?: null) as $cycle) {
            $rows .= '<tr><td>'.e($cycle['name']).'</td><td>'.e($cycle['status']).'</td><td>'.e($cycle['start_date']).'</td><td>'.e($cycle['end_date']).'</td><td>'.e($cycle['total_sales']).'</td></tr>';
        }

        return response('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الدورات</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:8px;text-align:right}</style></head><body><h1>تقرير الدورات</h1><table><thead><tr><th>اسم الدورة</th><th>الحالة</th><th>تاريخ البدء</th><th>تاريخ الانتهاء</th><th>إجمالي المبيعات</th></tr></thead><tbody>'.$rows.'</tbody></table></body></html>', 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    private function csvDownload(string $filename, array $headers, callable $rows)
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
            foreach ($rows() as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
