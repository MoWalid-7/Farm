<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('farm_name')->default('نظام إدارة المزرعة');
            $table->text('farm_information')->nullable();
            $table->string('currency', 3)->default('SAR');
            $table->boolean('backup_enabled')->default(true);
            $table->string('backup_frequency', 20)->default('weekly');
            $table->string('app_name')->default('Farm Management System');
            $table->string('app_version', 50)->default('1.0.0');
            $table->boolean('welcome_screen_completed')->default(false);
            $table->string('welcome_screen_status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
