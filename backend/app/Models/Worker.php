<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'phone', 'job_title', 'daily_wage', 'status', 'hired_at'];

    protected $casts = ['daily_wage' => 'decimal:2', 'hired_at' => 'date'];

    public function payments()
    {
        return $this->hasMany(WorkerPayment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
