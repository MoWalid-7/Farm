<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkerPayment extends Model
{
    use HasFactory;

    protected $fillable = ['worker_id', 'amount', 'payment_date', 'notes'];

    protected $casts = ['amount' => 'decimal:2', 'payment_date' => 'date'];

    public function worker()
    {
        return $this->belongsTo(Worker::class);
    }
}
