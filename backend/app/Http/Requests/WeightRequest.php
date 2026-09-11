<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class WeightRequest extends FormRequest {
    public function authorize(): bool{return true;}
    protected function prepareForValidation(): void { $this->merge(array_filter(['bird_count'=>$this->bird_count??$this->total_birds,'recorded_date'=>$this->recorded_date??$this->weight_date],fn($v)=>$v!==null)); }
    public function rules(): array{return ['cycle_id'=>['required','exists:cycles,id'],'bird_count'=>['required','integer','min:1'],'total_weight'=>['required','numeric','gt:0'],'recorded_date'=>['required','date']];}
}
