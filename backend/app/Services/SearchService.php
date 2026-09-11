<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;

class SearchService
{
    private const ENTITIES = [
        'workers' => [\App\Models\Worker::class, ['name', 'phone', 'job_title']],
        'expenses' => [\App\Models\Expense::class, ['category', 'description']],
        'revenues' => [\App\Models\Revenue::class, ['source', 'description']],
        'worker_payments' => [\App\Models\WorkerPayment::class, ['notes']],
        'cycles' => [\App\Models\Cycle::class, ['name', 'status']],
        'weights' => [\App\Models\Weight::class, ['recorded_date']],
        'customers' => [\App\Models\Customer::class, ['name', 'phone']],
        'sales' => [\App\Models\Sale::class, ['sale_date']],
        'suppliers' => [\App\Models\Supplier::class, ['name', 'phone', 'email']],
        'inventory_items' => [\App\Models\InventoryItem::class, ['name', 'sku', 'description']],
        'inventory_transactions' => [\App\Models\InventoryTransaction::class, ['reference', 'notes', 'transaction_date']],
    ];

    public function search(string $term, int $perEntity = 10): array
    {
        $results = [];
        foreach (self::ENTITIES as $type => [$class, $fields]) {
            $query = $class::query();
            if ($fields) {
                $query->where(function ($q) use ($fields, $term) {
                    foreach ($fields as $field) $q->orWhere($field, 'like', "%{$term}%");
                });
            } else {
                $query->where('id', is_numeric($term) ? (int) $term : 0);
            }
            foreach ($query->limit($perEntity)->get() as $model) {
                $results[] = [
                    'type' => $type,
                    'id' => $model->getKey(),
                    'title' => $this->title($model),
                    'data' => $model,
                ];
            }
        }
        return $results;
    }

    private function title(Model $model): string
    {
        foreach (['name', 'category', 'description', 'source', 'notes'] as $field) {
            if (filled($model->getAttribute($field))) return (string) $model->getAttribute($field);
        }
        return class_basename($model).' #'.$model->getKey();
    }
}
