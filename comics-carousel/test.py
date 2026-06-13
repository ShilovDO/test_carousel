import os

def print_directory_tree(start_path, prefix="", output_file=None):
    """Рекурсивно выводит дерево файлов и папок."""
    items = sorted(os.listdir(start_path))
    
    for i, item in enumerate(items):
        item_path = os.path.join(start_path, item)
        is_last = (i == len(items) - 1)
        
        # Определяем символы для дерева
        current_prefix = "└── " if is_last else "├── "
        next_prefix = "    " if is_last else "│   "
        
        line = f"{prefix}{current_prefix}{item}"
        print(line)
        if output_file:
            output_file.write(line + "\n")
        
        if os.path.isdir(item_path):
            print_directory_tree(item_path, prefix + next_prefix, output_file)

def read_and_combine_files(root_path, output_filename="combined_output.txt"):
    """Читает все файлы и объединяет их в один с подписями."""
    with open(output_filename, "w", encoding="utf-8") as outfile:
        # 1. Выводим иерархию файлов и папок
        outfile.write("=== ИЕРАРХИЯ ФАЙЛОВ И ПАПОК ===\n")
        outfile.write(f"{root_path}\n")
        print(f"\n=== ИЕРАРХИЯ ФАЙЛОВ И ПАПОК ===")
        print(f"{root_path}")
        
        print_directory_tree(root_path, "", outfile)
        
        outfile.write("\n\n=== СОДЕРЖИМОЕ ФАЙЛОВ ===\n\n")
        print("\n=== СОДЕРЖИМОЕ ФАЙЛОВ ===\n")
        
        # 2. Читаем содержимое всех файлов
        for dirpath, dirnames, filenames in os.walk(root_path):
            # Пропускаем сам выходной файл, если он в текущей директории
            if output_filename in filenames:
                filenames.remove(output_filename)
            
            for filename in sorted(filenames):
                file_path = os.path.join(dirpath, filename)
                
                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        content = infile.read()
                        
                        # Заголовок с относительным путем
                        relative_path = os.path.relpath(file_path, root_path)
                        header = f"\n{'='*60}\nФАЙЛ: {relative_path}\n{'='*60}\n"
                        
                        outfile.write(header)
                        outfile.write(content)
                        outfile.write("\n")
                        
                        print(f"Обработан: {relative_path}")
                        
                except UnicodeDecodeError:
                    error_msg = f"\n{'='*60}\nФАЙЛ: {relative_path}\n[Бинарный файл - содержимое не показано]\n{'='*60}\n"
                    outfile.write(error_msg)
                    print(f"Пропущен (бинарный): {relative_path}")
                    
                except Exception as e:
                    error_msg = f"\n{'='*60}\nФАЙЛ: {relative_path}\n[Ошибка чтения: {str(e)}]\n{'='*60}\n"
                    outfile.write(error_msg)
                    print(f"Ошибка: {relative_path} - {str(e)}")

if __name__ == "__main__":
    # Начинаем с текущей директории
    current_directory = os.getcwd()
    output_file = "combined_output.txt"
    
    print(f"Обрабатываю директорию: {current_directory}")
    print(f"Результат будет сохранен в: {output_file}")
    
    read_and_combine_files(current_directory, output_file)
    
    print(f"\nГотово! Все содержимое сохранено в файл: {output_file}")