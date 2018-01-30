#include <stdio.h> 
#include <QApplication>
#include <QLabel>
#include <QImage>
#include <QPixmap>
 
int main(int argc, char **argv)
{
    QApplication app(argc, argv);
    QLabel *label = new QLabel("test");
 
    QImage image;
    QPixmap buffer;
 
    //image.load("/home/apps/AGV/src/camera/src/image/imgGrey1.pgm");
    image.load("/home/apps/AGV/src/camera/cCamera/test_out.pgm");

    buffer = QPixmap::fromImage(image);
    
    label->setPixmap(buffer);                                                                               
    label->show();
 
    return app.exec();
} 
