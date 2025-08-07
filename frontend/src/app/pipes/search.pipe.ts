import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(items: any[], searchTerm: string, keys: string[]): any[] {
    if (!items || !searchTerm || !keys.length) {
      return items;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return items.filter(item =>
      keys.some(key => {
        const value = item[key];
        return value?.toString().toLowerCase().includes(lowerSearchTerm);
      })
    );
  }
}
