<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Revenue extends Model
{
    use HasFactory;

    protected $fillable = ['source', 'description', 'amount', 'revenue_date'];

    protected $casts = ['amount' => 'decimal:2', 'revenue_date' => 'date'];
}
