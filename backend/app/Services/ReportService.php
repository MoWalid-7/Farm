<?php

namespace App\Services;

use App\Models\Cycle;
use App\Models\Expense;
use App\Models\Revenue;
use App\Models\Worker;
use App\Models\WorkerPayment;
use Carbon\Carbon;

class ReportService
{
    public function financialSummary(?Carbon $from = null, ?Carbon $to = null): array
    {
        $sum = function (string $model, string $amount, string $date) use ($from, $to): float {
            $query = $model::query();
            if ($from) {
                $query->whereDate($date, '>=', $from);
            }
            if ($to) {
                $query->whereDate($date, '<=', $to);
            }

            return (float) $query->sum($amount);
        };

        $revenues = $sum(Revenue::class, 'amount', 'revenue_date');
        $expenses = $sum(Expense::class, 'amount', 'expense_date');
        $payments = $sum(WorkerPayment::class, 'amount', 'payment_date');

        return [
            'total_revenues' => $revenues,
            'total_expenses' => $expenses,
            'total_worker_payments' => $payments,
            'total_costs' => $expenses + $payments,
            'net_profit' => $revenues - $expenses - $payments,
            'active_workers' => Worker::active()->count(),
        ];
    }

    public function financial(string $period = 'custom', ?Carbon $from = null, ?Carbon $to = null): array
    {
        [$from, $to] = $this->periodDates($period, $from, $to);
        $summary = $this->financialSummary($from, $to);
        $rows = [];
        $cursor = $from->copy();
        $format = $period === 'monthly' ? 'Y-m' : 'Y-m-d';
        while ($cursor->lte($to)) {
            $end = match ($period) {
                'weekly' => $cursor->copy()->endOfWeek()->min($to),
                'monthly' => $cursor->copy()->endOfMonth()->min($to),
                default => $cursor->copy(),
            };
            $rows[] = [
                'from' => $cursor->toDateString(),
                'to' => $end->toDateString(),
                'label' => $cursor->format($format),
                'summary' => $this->financialSummary($cursor, $end),
            ];
            $cursor = $end->copy()->addDay()->startOfDay();
        }

        return ['period' => $period, 'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'summary' => $summary, 'breakdown' => $rows];
    }

    public function cycles(?Carbon $from = null, ?Carbon $to = null, ?int $cycleId = null): array
    {
        $query = Cycle::with(['weights', 'sales']);
        if ($cycleId) {
            $query->whereKey($cycleId);
        }
        if ($from || $to) {
            $rangeStart = $from ?: $to;
            $rangeEnd = $to ?: $from;
            $query->whereDate('start_date', '<=', $rangeEnd)
                ->where(function ($q) use ($rangeStart) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $rangeStart);
                });
        }

        return $query->latest('start_date')->get()->map(function (Cycle $cycle) {
            $sales = $cycle->sales;
            $weights = $cycle->weights;

            return [
                'id' => $cycle->id, 'name' => $cycle->name, 'status' => $cycle->status,
                'start_date' => optional($cycle->start_date)->toDateString(),
                'end_date' => optional($cycle->end_date)->toDateString(),
                'bird_count' => $cycle->bird_count,
                'total_weight' => (float) $weights->sum('total_weight'),
                'average_weight' => $weights->count() ? round((float) $weights->avg('average_weight'), 3) : 0,
                'sale_quantity' => (int) $sales->sum('quantity'),
                'total_sales' => (float) $sales->sum('total_amount'),
                'paid_sales' => (float) $sales->sum('paid_amount'),
                'remaining_sales' => (float) $sales->sum('remaining_amount'),
            ];
        })->values()->all();
    }

    private function periodDates(string $period, ?Carbon $from, ?Carbon $to): array
    {
        $from = $from ?: now()->startOfDay();
        $to = $to ?: $from->copy();

        return match ($period) {
            'daily' => [$from->copy()->startOfDay(), $from->copy()->endOfDay()],
            'weekly' => [$from->copy()->startOfWeek(), $from->copy()->endOfWeek()],
            'monthly' => [$from->copy()->startOfMonth(), $from->copy()->endOfMonth()],
            default => [$from->copy()->startOfDay(), $to->copy()->endOfDay()],
        };
    }
}
