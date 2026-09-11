<?php

namespace App\Observers;

use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Model;

class ActivityLogObserver
{
    public function created(Model $model): void { app(ActivityLogService::class)->record('created', $model, null, $model->getAttributes()); }

    public function updated(Model $model): void
    {
        app(ActivityLogService::class)->record('updated', $model, $model->getOriginal(), $model->getChanges());
    }

    public function deleted(Model $model): void { app(ActivityLogService::class)->record('deleted', $model, $model->getOriginal(), null); }
}
