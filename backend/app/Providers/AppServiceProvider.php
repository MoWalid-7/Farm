<?php

namespace App\Providers;

use App\Models\{Customer, Cycle, Expense, InventoryItem, InventoryTransaction, Revenue, Sale, Supplier, Weight, Worker, WorkerPayment};
use App\Observers\ActivityLogObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ([Customer::class, Cycle::class, Expense::class, InventoryItem::class,
            InventoryTransaction::class, Revenue::class, Sale::class, Supplier::class,
            Weight::class, Worker::class, WorkerPayment::class] as $model) {
            $model::observe(ActivityLogObserver::class);
        }
    }
}
