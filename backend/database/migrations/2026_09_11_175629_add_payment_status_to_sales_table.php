<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'payment_status')) {
                $table->string('payment_status', 20)->default('unpaid')->after('remaining_amount');
            }
        });
        // Update existing records to have correct payment_status
        \DB::statement("UPDATE sales SET payment_status = CASE
            WHEN paid_amount >= total_amount THEN 'paid'
            WHEN paid_amount > 0 THEN 'partially_paid'
            ELSE 'unpaid'
        END");
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};

